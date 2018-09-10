(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.GitBookPlugin = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var deselectCurrent = require('toggle-selection');

var defaultMessage = 'Copy to clipboard: #{key}, Enter';

function format(message) {
  var copyKey = (/mac os x/i.test(navigator.userAgent) ? '⌘' : 'Ctrl') + '+C';
  return message.replace(/#{\s*key\s*}/g, copyKey);
}

function copy(text, options) {
  var debug, message, reselectPrevious, range, selection, mark, success = false;
  if (!options) { options = {}; }
  debug = options.debug || false;
  try {
    reselectPrevious = deselectCurrent();

    range = document.createRange();
    selection = document.getSelection();

    mark = document.createElement('span');
    mark.textContent = text;
    mark.setAttribute('style', [
      // reset user styles for span element
      'all: unset',
      // prevents scrolling to the end of the page
      'position: fixed',
      'top: 0',
      'clip: rect(0, 0, 0, 0)',
      // used to preserve spaces and line breaks
      'white-space: pre',
      // do not inherit user-select (it may be `none`)
      '-webkit-user-select: text',
      '-moz-user-select: text',
      '-ms-user-select: text',
      'user-select: text',
    ].join(';'));

    document.body.appendChild(mark);

    range.selectNode(mark);
    selection.addRange(range);

    var successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('copy command was unsuccessful');
    }
    success = true;
  } catch (err) {
    debug && console.error('unable to copy using execCommand: ', err);
    debug && console.warn('trying IE specific stuff');
    try {
      window.clipboardData.setData('text', text);
      success = true;
    } catch (err) {
      debug && console.error('unable to copy using clipboardData: ', err);
      debug && console.error('falling back to prompt');
      message = format('message' in options ? options.message : defaultMessage);
      window.prompt(message, text);
    }
  } finally {
    if (selection) {
      if (typeof selection.removeRange == 'function') {
        selection.removeRange(range);
      } else {
        selection.removeAllRanges();
      }
    }

    if (mark) {
      document.body.removeChild(mark);
    }
    reselectPrevious();
  }

  return success;
}

module.exports = copy;

},{"toggle-selection":2}],2:[function(require,module,exports){

module.exports = function () {
  var selection = document.getSelection();
  if (!selection.rangeCount) {
    return function () {};
  }
  var active = document.activeElement;

  var ranges = [];
  for (var i = 0; i < selection.rangeCount; i++) {
    ranges.push(selection.getRangeAt(i));
  }

  switch (active.tagName.toUpperCase()) { // .toUpperCase handles XHTML
    case 'INPUT':
    case 'TEXTAREA':
      active.blur();
      break;

    default:
      active = null;
      break;
  }

  selection.removeAllRanges();
  return function () {
    selection.type === 'Caret' &&
    selection.removeAllRanges();

    if (!selection.rangeCount) {
      ranges.forEach(function(range) {
        selection.addRange(range);
      });
    }

    active &&
    active.focus();
  };
};

},{}],3:[function(require,module,exports){
'use strict';

var copy = require('copy-to-clipboard');
var GitBook = require('gitbook-core');
var React = GitBook.React;


var COPIED_TIMEOUT = 1000;

/**
 * Get children as text
 * @param {React.Children} children
 * @return {String}
 */
function getChildrenToText(children) {
    return React.Children.map(children, function (child) {
        if (typeof child === 'string') {
            return child;
        } else {
            return child.props.children ? getChildrenToText(child.props.children) : '';
        }
    }).join('');
}

var CodeBlockWithCopy = React.createClass({
    displayName: 'CodeBlockWithCopy',

    propTypes: {
        children: React.PropTypes.node,
        i18n: GitBook.PropTypes.I18n
    },

    getInitialState: function getInitialState() {
        return {
            copied: false
        };
    },
    onClick: function onClick(event) {
        var _this = this;

        var children = this.props.children;


        event.preventDefault();
        event.stopPropagation();

        var text = getChildrenToText(children);
        copy(text);

        this.setState({ copied: true }, function () {
            _this.timeout = setTimeout(function () {
                _this.setState({
                    copied: false
                });
            }, COPIED_TIMEOUT);
        });
    },
    componentWillUnmount: function componentWillUnmount() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    },
    render: function render() {
        var _props = this.props,
            children = _props.children,
            i18n = _props.i18n;
        var copied = this.state.copied;


        return React.createElement(
            'div',
            { className: 'CodeBlockWithCopy-Container' },
            React.createElement(GitBook.ImportCSS, { href: 'gitbook/copy-code/button.css' }),
            children,
            React.createElement(
                'span',
                { className: 'CodeBlockWithCopy-Button', onClick: this.onClick },
                copied ? i18n.t('COPIED') : i18n.t('COPY')
            )
        );
    }
});

CodeBlockWithCopy = GitBook.connect(CodeBlockWithCopy);

module.exports = GitBook.createPlugin({
    activate: function activate(dispatch, getState, _ref) {
        var Components = _ref.Components;

        dispatch(Components.registerComponent(CodeBlockWithCopy, { role: 'html:pre' }));
    }
});

},{"copy-to-clipboard":1,"gitbook-core":"gitbook-core"}]},{},[3])(3)
});