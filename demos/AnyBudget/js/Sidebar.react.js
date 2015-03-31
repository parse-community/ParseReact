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

var DonutChart = require('./DonutChart.react.js');

var Sidebar = React.createClass({
  mixins: [ParseReact.Mixin],

  getInitialState: function() {
    return {
      editingBudget: false
    };
  },

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
    var budget = '$' + (this.data.user.budget || 0);
    var totals = {};
    for (var i = 0; i < this.data.expenses.length; i++) {
      var cat = this.data.expenses[i].category;
      totals[cat] = this.data.expenses[i].costCents + (totals[cat] || 0);
    }
    var segments = [];
    for (var c in totals) {
      segments.push({ id: c, total: totals[c] });
    }

    return (
      <div className='sidebar'>
        <h3>Monthly Budget:</h3>
        {this.state.editingBudget ?
          <input
            ref='budget'
            type='text'
            defaultValue={budget}
            onBlur={this.updateBudget}
            onKeyDown={this.budgetKeyDown} /> :
          <div className='budget' onClick={this.toggleEditing}>{budget}</div>}
        <DonutChart width={120} height={120} segments={segments} />
      </div>
    );
  },

  budgetKeyDown: function(e) {
    if (e.keyCode === 13) {
      this.updateBudget(e);
    }
  },

  updateBudget: function(e) {
    console.log('blur');
    console.log(e);
    var newBudget = e.target.value.replace(/\.\d*/g, '').replace(/[^\d]/g, '');
    ParseReact.Mutation.Set(this.data.user, { budget: newBudget }).dispatch();
    this.setState({
      editingBudget: false
    });
  },

  toggleEditing: function() {
    var self = this;
    var shouldFocus = !this.state.editingBudget;
    this.setState({
      editingBudget: !this.state.editingBudget
    }, function() {
      if (shouldFocus) {
        React.findDOMNode(self.refs.budget).focus();
      }
    });
  }
});

module.exports = Sidebar;