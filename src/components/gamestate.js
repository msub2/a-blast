/* global AFRAME */

AFRAME.registerComponent('gamestate', {
  schema: {
    health: {default: 5},
    numEnemies: {default: 0},
    numSequences: {default: 0},
    points: {default: 0},
    numEnemiesToWin: {default: 100},
    isGameOver: {default: false},
    isGameWin: {default: false},
    state: {default: 'STATE_MAIN_MENU', oneOf: ['STATE_MAIN_MENU', 'STATE_PLAYING', 'STATE_GAME_OVER', 'STATE_GAME_WIN']},
    wave: {default: 0},
    waveSequence: {default: 0}
  },

  init: function () {
    var self = this;
    var el = this.el;
    var initialState = this.initialState;
    var state = this.data;

    // Initial state.
    if (!initialState) { initialState = state; }

    el.emit('gamestate-initialized', {state: initialState});
    registerHandler('enemy-death', function (newState) {
      newState.points += 1;
      if (newState.points >= self.data.numEnemiesToWin) {
        newState.state = 'STATE_GAME_WIN';
        newState.isGameWin = true;
      }

      newState.numEnemies--;
      // All enemies killed, advance wave.
      if (newState.numEnemies === 0) {
        newState.numSequences--;
        newState.waveSequence++;
        console.log('1',newState);
        if (newState.numSequences === 0) {
          newState.waveSequence = 0;
          newState.wave++;
          console.log(newState);
        }
      }
      return newState;
    });

    registerHandler('wave-created', function (newState, params) {
      var wave = params.detail.wave;
      newState.numSequences = wave.sequences.length;
      newState.waveSequence = 0;
      return newState;
    });

    registerHandler('enemy-spawn', function (newState) {
      newState.numEnemies++;
      return newState;
    });

    registerHandler('start-game', function (newState) {
      newState.isGameOver = false;
      newState.isGameWin = false;
      newState.state = 'STATE_PLAYING';
      return newState;
    });

    registerHandler('player-hit', function (newState) {
      if (newState.state === 'STATE_PLAYING') {
        newState.health -= 1;
        if (newState.health <= 0) {
          newState.isGameOver = true;
          newState.numEnemies = 0;
          newState.state = 'STATE_GAME_OVER';
        }
      }
      return newState;
    });

    registerHandler('reset', function () {
      return initialState;
    });

    function registerHandler (event, handler) {
      el.addEventListener(event, function (param) {
        var newState = handler(AFRAME.utils.extend({}, state), param);
        publishState(event, newState);
      });
    }

    function publishState (event, newState) {
      var oldState = AFRAME.utils.extend({}, state);
      //console.log(oldState, newState);
      el.setAttribute('gamestate', newState);
      state = newState;
      el.emit('gamestate-changed', {
        event: event,
        diff: AFRAME.utils.diff(oldState, newState),
        state: newState
      });
      //console.log(event, newState);
    }
  }
});

/**
 * Bind game state to a component property.
 */
AFRAME.registerComponent('gamestate-bind', {
  schema: {
    default: {},
    parse: AFRAME.utils.styleParser.parse
  },

  update: function () {
    var sceneEl = this.el.closestScene();
    if (sceneEl.hasLoaded) {
      this.updateBinders();
    }
    sceneEl.addEventListener('loaded', this.updateBinders.bind(this));
  },

  updateBinders: function () {
    var data = this.data;
    var el = this.el;
    var subscribed = Object.keys(this.data);

    el.sceneEl.addEventListener('gamestate-changed', function (evt) {
      syncState(evt.detail.diff);
    });

    el.sceneEl.addEventListener('gamestate-initialized', function (evt) {
      syncState(evt.detail.state);
    });

    function syncState (state) {
      Object.keys(state).forEach(function updateIfNecessary (stateProperty) {
        var targetProperty = data[stateProperty];
        var value = state[stateProperty];
        if (subscribed.indexOf(stateProperty) === -1) { return; }
        AFRAME.utils.entity.setComponentProperty(el, targetProperty, value);
      });
    }
  }
});
