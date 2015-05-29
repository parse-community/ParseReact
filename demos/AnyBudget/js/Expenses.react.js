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

var ExpenseCreator = require('./ExpenseCreator.react.js');

var Categories = require('./Categories.js');

var Expenses = React.createClass({
  mixins: [ParseReact.Mixin],

  observe: function() {
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 0, 0, 0);
    var monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 0, 0);
    return {
      expenses: (new Parse.Query('Expense'))
                  .greaterThan('createdAt', monthStart)
                  .lessThan('createdAt', monthEnd)
                  .ascending('createdAt')
    };
  },

  render: function() {
    var content = (
      <div className='emptyTable'>
        <h2>You have no expenses this month!</h2>
        <h3>(How frugal of you)</h3>
      </div>
    );
    if (this.data.expenses.length) {
      content = (
        <div className='expenseTable'>
          {this.data.expenses.map(function(ex) {
            var costString = '$' + (ex.costCents / 100).toFixed(2);
            return (
              <div key={ex.objectId} className='expenseRow'>
                <span className='expenseName'>{ex.name}</span>
                <span className='expenseCost'>{costString}</span>
                <select
                  className='expenseCategory'
                  value={ex.category}
                  onChange={this.recategorize.bind(this, ex)}>
                  {Categories.map(function(c, i) {
                    return i ? <option key={c} value={c}>{c}</option> : null;
                  })}
                </select>
                <a
                  className='delete'
                  onClick={this.deleteExpense.bind(this, ex)}>
                  &times;
                </a>
              </div>
            );
          }, this)}
        </div>
      );
    } else if (this.pendingQueries().length) {
      content = <div className='loading' />;
    }
    return (
      <div className='appContent'>
        {content}
        <ExpenseCreator />
      </div>
    );
  },

  recategorize: function(ex, e) {
    var newCategory = e.target.value;
    ParseReact.Mutation.Set(ex, { category: newCategory }).dispatch();
  },

  deleteExpense: function(ex) {
    ParseReact.Mutation.Destroy(ex).dispatch();
  }
});

module.exports = Expenses;