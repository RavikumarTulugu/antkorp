/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* globals PDFJS, PDFBug, FirefoxCom, Stats, Cache, PDFFindBar */
/* globals PDFFindController, ProgressBar, getFileName, CustomStyle */
/* globals getOutputScale, TextLayerBuilder */



var DEFAULT_URL = '';
var DEFAULT_SCALE = 'auto';
var DEFAULT_SCALE_DELTA = 1.1;
var UNKNOWN_SCALE = 0;
var CACHE_SIZE = 20;
var CSS_UNITS = 96.0 / 72.0;
var SCROLLBAR_PADDING = 40;
var VERTICAL_PADDING = 5;
var MIN_SCALE = 0.25;
var MAX_SCALE = 4.0;
var SETTINGS_MEMORY = 20;
var SCALE_SELECT_CONTAINER_PADDING = 8;
var SCALE_SELECT_PADDING = 22;
var RenderingStates = {
  INITIAL: 0,
  RUNNING: 1,
  PAUSED: 2,
  FINISHED: 3
};
var FindStates = {
  FIND_FOUND: 0,
  FIND_NOTFOUND: 1,
  FIND_WRAPPED: 2,
  FIND_PENDING: 3
};

//#if (FIREFOX || MOZCENTRAL || B2G || GENERIC || CHROME)
//PDFJS.workerSrc = '../build/pdf.js';
//#endif

var mozL10n = document.mozL10n || document.webL10n;

//#include ui_utils.js

function scrollIntoView(element, spot) {
  // Assuming offsetParent is available (it's not available when viewer is in
  // hidden iframe or object). We have to scroll: if the offsetParent is not set
  // producing the error. See also animationStartedClosure.
  var parent = element.offsetParent;
  var offsetY = element.offsetTop + element.clientTop;
  if (!parent) {
    console.error('offsetParent is not set -- cannot scroll');
    return;
  }
  while (parent.clientHeight == parent.scrollHeight) {
    offsetY += parent.offsetTop;
    parent = parent.offsetParent;
    if (!parent)
      return; // no need to scroll
  }
  if (spot)
    offsetY += spot.top;
  parent.scrollTop = offsetY;
}


//#if FIREFOX || MOZCENTRAL
//#include firefoxcom.js
//#endif

// Settings Manager - This is a utility for saving settings
// First we see if localStorage is available
// If not, we use FUEL in FF
// Use asyncStorage for B2G
var Settings = (function SettingsClosure() {
//#if !(FIREFOX || MOZCENTRAL || B2G)
  var isLocalStorageEnabled = (function localStorageEnabledTest() {
    // Feature test as per http://diveintohtml5.info/storage.html
    // The additional localStorage call is to get around a FF quirk, see
    // bug #495747 in bugzilla
    try {
      return 'localStorage' in window && window['localStorage'] !== null &&
          localStorage;
    } catch (e) {
      return false;
    }
  })();
//#endif

  function Settings(fingerprint) {
    this.fingerprint = fingerprint;
    this.initializedPromise = new PDFJS.Promise();

    var resolvePromise = (function settingsResolvePromise(db) {
      this.initialize(db || '{}');
      this.initializedPromise.resolve();
    }).bind(this);

//#if B2G
//  asyncStorage.getItem('database', resolvePromise);
//#endif

//#if FIREFOX || MOZCENTRAL
//  resolvePromise(FirefoxCom.requestSync('getDatabase', null));
//#endif

//#if !(FIREFOX || MOZCENTRAL || B2G)
    if (isLocalStorageEnabled)
      resolvePromise(localStorage.getItem('database'));
//#endif
  }

  Settings.prototype = {
    initialize: function settingsInitialize(database) {
      database = JSON.parse(database);
      if (!('files' in database))
        database.files = [];
      if (database.files.length >= SETTINGS_MEMORY)
        database.files.shift();
      var index;
      for (var i = 0, length = database.files.length; i < length; i++) {
        var branch = database.files[i];
        if (branch.fingerprint == this.fingerprint) {
          index = i;
          break;
        }
      }
      if (typeof index != 'number')
        index = database.files.push({fingerprint: this.fingerprint}) - 1;
      this.file = database.files[index];
      this.database = database;
    },

    set: function settingsSet(name, val) {
      if (!this.initializedPromise.isResolved)
        return;

      var file = this.file;
      file[name] = val;
      var database = JSON.stringify(this.database);

//#if B2G
//    asyncStorage.setItem('database', database);
//#endif

//#if FIREFOX || MOZCENTRAL
//    FirefoxCom.requestSync('setDatabase', database);
//#endif

//#if !(FIREFOX || MOZCENTRAL || B2G)
      if (isLocalStorageEnabled)
        localStorage.setItem('database', database);
//#endif
    },

    get: function settingsGet(name, defaultValue) {
      if (!this.initializedPromise.isResolved)
        return defaultValue;

      return this.file[name] || defaultValue;
    }
  };

  return Settings;
})();

var cache = new Cache(CACHE_SIZE);
var currentPageNumber = 1;

// TODO: Enable the FindBar *AFTER* the pagesPromise in the load function
// got resolved
//#include pdf_find_bar.js
//#include pdf_find_controller.js

var PDFHistory = {
  initialized: false,
  initialDestination: null,

  initialize: function pdfHistoryInitialize(fingerprint) {
    if (PDFJS.disableHistory || window.parent !== window) {
      // The browsing history is only enabled when the viewer is standalone,
      // i.e. not when it is embedded in a page.
      return;
    }
    this.initialized = true;
    this.reInitialized = false;
    this.allowHashChange = true;
    this.historyUnlocked = true;

    this.previousHash = window.location.hash.substring(1);
    this.currentBookmark = '';
    this.currentPage = 0;
    this.updatePreviousBookmark = false;
    this.previousBookmark = '';
    this.previousPage = 0;
    this.nextHashParam = '';

    this.fingerprint = fingerprint;
    this.currentUid = this.uid = 0;
    this.current = {};

    var state = window.history.state;
    if (this._isStateObjectDefined(state)) {
      // This case corresponds to navigating back to the document
      // from another page in the browser history.
      if (state.target.dest) {
        this.initialDestination = state.target.dest;
      } else {
        PDFView.initialBookmark = state.target.hash;
      }
      this.currentUid = state.uid;
      this.uid = state.uid + 1;
      this.current = state.target;
    } else {
      // This case corresponds to the loading of a new document.
      if (state && state.fingerprint &&
          this.fingerprint !== state.fingerprint) {
        // Reinitialize the browsing history when a new document
        // is opened in the web viewer.
        this.reInitialized = true;
      }
      window.history.replaceState({ fingerprint: this.fingerprint }, '', '');
    }

    var self = this;
    window.addEventListener('popstate', function pdfHistoryPopstate(evt) {
      evt.preventDefault();
      evt.stopPropagation();

      if (!self.historyUnlocked) {
        return;
      }
      if (evt.state) {
        // Move back/forward in the history.
        self._goTo(evt.state);
      } else {
        // Handle the user modifying the hash of a loaded document.
        self.previousHash = window.location.hash.substring(1);
        if (self.uid === 0) {
          var previousParams = (self.previousHash && self.currentBookmark &&
                                self.previousHash !== self.currentBookmark) ?
            { hash: self.currentBookmark } : { page: 1 };
          self.historyUnlocked = false;
          self.allowHashChange = false;
          window.history.back();
          self._pushToHistory(previousParams, false, true);
          window.history.forward();
          self.historyUnlocked = true;
        }
        self._pushToHistory({ hash: self.previousHash }, false, true);
        if (self.currentBookmark) {
          self.previousBookmark = self.currentBookmark;
        }
      }
    }, false);

    window.addEventListener('beforeunload',
                            function pdfHistoryBeforeunload(evt) {
      var previousParams = self._getPreviousParams(null, true);
      if (previousParams) {
        self._pushToHistory(previousParams, false);
      }
      if (PDFView.isPresentationMode) {
        // Prevent the user from accidentally navigating away from
        // the document when presentation mode is active.
        evt.preventDefault();
      }
    }, false);
  },

  _isStateObjectDefined: function pdfHistory_isStateObjectDefined(state) {
    return (state && state.uid >= 0 &&
            state.fingerprint && this.fingerprint === state.fingerprint &&
            state.target && state.target.hash) ? true : false;
  },

  get isHashChangeUnlocked() {
    if (!this.initialized) {
      return true;
    }
    // If the current hash changes when moving back/forward in the history,
    // this will trigger a 'popstate' event *as well* as a 'hashchange' event.
    // Since the hash generally won't correspond to the exact the position
    // stored in the history's state object, triggering the 'hashchange' event
    // can thus corrupt the browser history.
    //
    // When the hash changes during a 'popstate' event, we *only* prevent the
    // first 'hashchange' event and immediately reset allowHashChange.
    // If it is not reset, the user would not be able to change the hash.

    var temp = this.allowHashChange;
    this.allowHashChange = true;
    return temp;
  },

  updateCurrentBookmark: function pdfHistoryUpdateCurrentBookmark(bookmark,
                                                                  pageNum) {
    if (this.initialized) {
      this.currentBookmark = bookmark.substring(1);
      this.currentPage = pageNum | 0;
      if (this.updatePreviousBookmark) {
        this.previousBookmark = this.currentBookmark;
        this.previousPage = this.currentPage;
        this.updatePreviousBookmark = false;
      }
    }
  },

  updateNextHashParam: function pdfHistoryUpdateNextHashParam(param) {
    if (this.initialized) {
      this.nextHashParam = param;
    }
  },

  push: function pdfHistoryPush(params, isInitialBookmark) {
    if (!(this.initialized && this.historyUnlocked)) {
      return;
    }
    if (params.dest && !params.hash) {
      params.hash = (this.current.hash && this.current.dest &&
                     this.current.dest === params.dest) ?
        this.current.hash :
        PDFView.getDestinationHash(params.dest).split('#')[1];
    }
    if (params.page) {
      params.page |= 0;
    }
    if (isInitialBookmark && this.uid === 0) {
      this._pushToHistory(params, false);
      this.previousHash = window.location.hash.substring(1);
      this.updatePreviousBookmark = this.nextHashParam ? false : true;
      return;
    }
    if (this.nextHashParam && this.nextHashParam === params.hash) {
      this.nextHashParam = null;
      this.updatePreviousBookmark = true;
      return;
    }

    if (params.hash) {
      if (this.current.hash) {
        if (this.current.hash !== params.hash) {
          this._pushToHistory(params, true);
        } else if (!this.current.page && params.page) {
          this._pushToHistory(params, false, true);
        }
      } else {
        this._pushToHistory(params, true);
      }
    } else if (this.current.page && params.page &&
               this.current.page !== params.page) {
      this._pushToHistory(params, true);
    }
  },

  _getPreviousParams: function pdfHistory_getPreviousParams(onlyCheckPage,
                                                            beforeUnload) {
    if (!(this.currentBookmark && this.currentPage)) {
      return null;
    }
    if ((!this.current.dest && !onlyCheckPage) || beforeUnload) {
      if (this.previousBookmark === this.currentBookmark) {
        return null;
      }
    } else if (this.current.page || onlyCheckPage) {
      if (this.previousPage === this.currentPage) {
        return null;
      }
    } else {
      return null;
    }
    var params = { hash: this.currentBookmark, page: this.currentPage };
    if (PDFView.isPresentationMode) {
      params.hash = null;
    }
    return params;
  },

  _stateObj: function pdfHistory_stateObj(params) {
    return { fingerprint: this.fingerprint, uid: this.uid, target: params };
  },

  _pushToHistory: function pdfHistory_pushToHistory(params,
                                                    addPrevious, overwrite) {
    if (!this.initialized) {
      return;
    }
    if (!params.hash && params.page) {
      params.hash = ('page=' + params.page);
    }
    if (addPrevious && !overwrite) {
      var previousParams = this._getPreviousParams();
      if (previousParams) {
        this._pushToHistory(previousParams, false);
      }
    }
    if (overwrite || this.uid === 0) {
      window.history.replaceState(this._stateObj(params), '', '');
    } else {
      window.history.pushState(this._stateObj(params), '', '');
    }
    this.currentUid = this.uid++;
    this.current = params;
    this.updatePreviousBookmark = true;
  },

  _goTo: function pdfHistory_goTo(state) {
    if (!(this.initialized && this.historyUnlocked &&
          this._isStateObjectDefined(state))) {
      return;
    }
    if (!this.reInitialized && state.uid < this.currentUid) {
      var previousParams = this._getPreviousParams(true);
      if (previousParams) {
        this._pushToHistory(this.current, false);
        this._pushToHistory(previousParams, false);
        this.currentUid = state.uid;
        window.history.back();
        return;
      }
    }
    this.historyUnlocked = false;

    if (state.target.dest) {
      PDFView.navigateTo(state.target.dest);
    } else {
      PDFView.setHash(state.target.hash);
    }
    this.currentUid = state.uid;
    if (state.uid > this.uid) {
      this.uid = state.uid;
    }
    this.current = state.target;
    this.updatePreviousBookmark = true;

    var currentHash = window.location.hash.substring(1);
    if (this.previousHash !== currentHash) {
      this.allowHashChange = false;
    }
    this.previousHash = currentHash;

    this.historyUnlocked = true;
  },

  back: function pdfHistoryBack() {
    this.go(-1);
  },

  forward: function pdfHistoryForward() {
    this.go(1);
  },

  go: function pdfHistoryGo(direction) {
    if (this.initialized && this.historyUnlocked) {
      var state = window.history.state;
      if (direction === -1 && state && state.uid > 0) {
        window.history.back();
      } else if (direction === 1 && state && state.uid < (this.uid - 1)) {
        window.history.forward();
      }
    }
  }
};

