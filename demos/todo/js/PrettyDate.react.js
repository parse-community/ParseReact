/*
 *  Copyright (c) 2015, Parse, LLC. All rights reserved.
 *
 *  You are hereby granted a non-exclusive, worldwide, royalty-free license to
 *  use, copy, modify, and distribute this software in source code or binary
 *  form for use in connection with the web services and APIs provided by Parse.
 *
 *  As with any software that integrates with the Parse platform, your use of
 *  this software is subject to the Parse Terms of Service
 *  [https://www.parse.com/about/terms]. This copyright notice shall be
 *  included in all copies or substantial portions of the software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 *  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 *  IN THE SOFTWARE.
 *
 */

/**
 * Render a date in a more useful style.
 * Dates within the last hour will be in the format of "3 minutes ago,"
 * dates within the last day will be in the format of "5 hours ago,"
 * and other dates will be in the format of "March 12"
 */

var React = require('react');

var months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

var PrettyDate = React.createClass({
  componentWillMount: function() {
    this.interval = null;
  },
  componentDidMount: function() {
    var delta = (new Date() - this.props.value) / 1000;
    if (delta < 60 * 60) {
      this.setInterval(this.forceUpdate.bind(this), 10000);
    }
  },
  componentWillUnmount: function() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  },
  setInterval: function() {
    this.interval = setInterval.apply(null, arguments);
  },
  render: function() {
    var val = this.props.value;
    var text = months[val.getMonth()] + ' ' + val.getDate();
    var delta = (new Date() - val) / 1000;
    if (delta < 60) {
      text = 'Just now';
    } else if (delta < 60 * 60) {
      var mins = ~~(delta / 60);
      text = mins + (mins === 1 ? ' minute ago' : ' minutes ago');
    } else if (delta < 60 * 60 * 24) {
      var hours = ~~(delta / 60 / 60);
      text = hours + (hours === 1 ? ' hour ago' : ' hours ago');
    }
    return (
      <span>{text}</span>
    );
  }
});

module.exports = PrettyDate;
