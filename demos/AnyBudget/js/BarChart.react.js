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

var BarChart = React.createClass({
  getInitialState: function() {
    return { width: 0 };
  },

  componentWillReceiveProps: function(nextProps) {
    var fillPercent = nextProps.value / nextProps.max * 100;
    if (!isFinite(fillPercent)) {
      fillPercent = 100;
    }
    var self = this;
    setTimeout(function() {
      self.setState({ width: fillPercent });
    }, 0);
  },

  componentDidMount: function() {
    var fillPercent = this.props.value / this.props.max * 100;
    if (!isFinite(fillPercent)) {
      fillPercent = 100;
    }
    var self = this;
    setTimeout(function() {
      self.setState({ width: fillPercent });
    }, 0);
  },

  render: function() {
    var fillPercent = this.props.value / this.props.max * 100;
    return (
      <div className='barChartWrap'>
        <div className='barChartFill' style={{width: this.state.width + '%'}} />
      </div>
    );
  }
});

module.exports = BarChart;