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

var React = require('react');
var Parse = require('parse').Parse;
var ParseReact = require('parse-react');

var BarChart = require('./BarChart.react.js');

var Overview = React.createClass({
  mixins: [ParseReact.Mixin],

  observe: function() {
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 0, 0, 0);
    var monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 0, 0);
    return {
      expenses: (new Parse.Query('Expense'))
                  .greaterThan('createdAt', monthStart)
                  .lessThan('createdAt', monthEnd)
                  .ascending('createdAt'),
      user: ParseReact.currentUser
    };
  },

  render: function() {
    var totals = {};
    for (var i = 0; i < this.data.expenses.length; i++) {
      var cat = this.data.expenses[i].category;
      totals[cat] = this.data.expenses[i].costCents + (totals[cat] || 0);
    }
    var segments = [];
    for (var c in totals) {
      segments.push({ category: c, total: totals[c] / 100 });
    }
    var budget = this.data.user.budget;

    var content = segments.map(function(s) {
      return (
        <div key={s.category}>
          {s.category}
          <BarChart value={s.total} max={budget} />
        </div>
      );
    });
    if (this.pendingQueries().length) {
      content = <div className='loading' />;
    } else if (segments.length < 1) {
      content = (
        <div className='emptyTable'>
          <h2>You have no expenses this month!</h2>
          <h3>(How frugal of you)</h3>
        </div>
      );
    }
    return (
      <div className='appContent'>
        {content}
      </div>
    );
  }
});

module.exports = Overview;