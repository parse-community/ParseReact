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

var Categories = require('./Categories.js');

var ExpenseCreator = React.createClass({
  getInitialState: function() {
    return {
      fileData: ''
    };
  },

  render: function() {
    return (
      <div className='expenseCreator centered'>
        <input
          className='name'
          type='text'
          ref='name'
          placeholder='File a new expense' />
        <input
          className='cost'
          type='text'
          ref='cost'
          placeholder='$0.00' />
        <select ref='category'>
          {Categories.map(function(c, i) {
            return <option key={c} value={i ? c : ''}>{c}</option>;
          })}
        </select>
        <a className='button' onClick={this.addExpense}>
          Add expense +
        </a>
      </div>
    );
  },

  addExpense: function() {
    var name = React.findDOMNode(this.refs.name);
    var cost = React.findDOMNode(this.refs.cost);
    var category = React.findDOMNode(this.refs.category);
    if (name.value === '' || cost.value === '' || category.value === '') {
      return;
    }
    if (!cost.value.match(/^\$?\d+(\.\d*)?$/)) {
      return;
    }
    var costCents = Number(cost.value.replace('$', '')) * 100;
    // ACL, so that only the current user can access this object
    var acl = new Parse.ACL(Parse.User.current());
    ParseReact.Mutation.Create('Expense', {
      name: name.value,
      category: category.value,
      costCents: costCents,
      ACL: acl
    }).dispatch().then(function() {
      name.value = '';
      cost.value = '';
      category.value = '';
    });
  }
});

module.exports = ExpenseCreator;