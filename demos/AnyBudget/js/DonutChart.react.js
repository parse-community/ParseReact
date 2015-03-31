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

var DonutChart = React.createClass({
  render: function() {
    var segments = this.props.segments || [];
    var total = 0;
    var i;
    for (i = segments.length; i--;) {
      total += segments[i].total;
    }
    var cx = (this.props.width / 2)|0;
    var cy = (this.props.height / 2)|0;
    var r = Math.min(cx, cy) * 0.9;

    var lastX = cx + r;
    var lastY = cy;
    var alpha = 0;

    var children = [];

    for (i = 0; i < segments.length; i++) {
      var arc = segments[i].total / total * 2 * Math.PI;
      var angle = Math.min(arc, Math.PI) + alpha;
      var endX = r * Math.cos(angle) + cx;
      var endY = r * Math.sin(angle) + cy;
      var path = ['M', cx, cy, 'L', lastX, lastY, 'A', r, r, 0, 0, 1, endX, endY];
      if (arc > Math.PI) {
        angle = arc + alpha;
        endX = r * Math.cos(angle) + cx;
        endY = r * Math.sin(angle) + cy;
        path = path.concat(['A', r, r, 0, 0, 1, endX, endY]);
      }
      path.push('Z');
      children.push(
        <path
          key={segments[i].id}
          d={path.join(' ')}
          style={{transformOrigin: cx + 'px ' + cy + 'px'}} />
      );
      children.push(
        <text
          key={segments[i].id+'T'}
          textAnchor='middle'
          x={cx}
          y={cy * 2 + 20}>
          {segments[i].id}
        </text>
      );

      lastX = endX;
      lastY = endY;
      alpha = angle;
    }

    return (
      <svg
        className='donutChart'
        width={this.props.width}
        height={this.props.height + 40}>
        {children}
        <circle cx={cx} cy={cy} r={r/2} fill='white' />
      </svg>
    );
  }
});

module.exports = DonutChart;