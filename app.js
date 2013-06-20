/* Some templating utilities
---------------------------------------------*/
rivets.binders.height = function(el, value) {
  el.style.height = value + 'px'
}

/* Counter Device. Extends TimedAggregator to increment 'count' property of passed struct

https://github.com/ismasan/plumber.js/blob/master/src/devices/timed_aggregator.js
---------------------------------------------*/
var Counter = Plumber.Devices.TimedAggregator.extend({
  startValues: {
    count: 0
  },

  aggregate: function (mem, struct) {
    mem.set('count', mem.get('count') + 1)
    var typeCount = mem.get(struct.get('type')) || 0
    mem.set(struct.get('type'), typeCount + 1)
  }
})

/* Factory funtion for a "capped view" that holds a limited number of DOM nodes at a time.

A capped view is composed of a capped index that pipes to a normal Rivets view.

https://github.com/ismasan/plumber.js/blob/master/src/devices/capped_index.js
https://github.com/ismasan/plumber.js/blob/master/src/view/view.js
---------------------------------------------*/
function cappedView($e, limit) {
  var index = new Plumber.Devices.CappedIndex(limit)
  var view = new Plumber.View($e)
  index.pipe(view)
  return index
}

var COLORS = {
  pageview: '#397249',
  order: '#628B61',
  login: '#9CB770',
  request: '#F3D5BD',
  product: '#C7E1BA'
}

/* Factory funtion for a pie chart view using piety.js

http://benpickles.github.io/peity/
---------------------------------------------*/
function pieView($e, delay) {
  var counter = new Counter(delay)
  
  counter.on('add', function (mem) {
    var str = []
    var colors = []
    var keys = Object.keys(COLORS).sort()
    
    keys.forEach(function (i) {
      str.push(mem.get(i) || 0)
      colors.push(COLORS[i])
    })

    $e.html(str.join(','))
    
    $e.peity("pie", {
      colours: colors
    });
    
  })
  
  return counter
}



////////////////////////////////////////////////////////////////////
// APPLICATION
////////////////////////////////////////////////////////////////////

/* Use the primitives above to compose demo dashboard application
---------------------------------------------*/

/* A central capped index to hold all of our incoming data.
-------------------------------------------------------------*/
var index = new Plumber.Devices.CappedIndex()

/* A mock data stream that implements the Pipe interface.
It could be an Ajax poller, a WebSocket, etc.
-------------------------------------------------------------*/
var stream = new MockStream()

/* This view shows all incoming data using a capped, rolling view
-------------------------------------------------------------*/
var allView = cappedView($('#all'), 24)

/* A couple of rolling views of 10 elements each
-------------------------------------------------------------*/
var filteredView1 = cappedView($('#filter1'), 10)
var filteredView2 = cappedView($('#filter2'), 10)

/* A router that routes pageviews and orders to different rolling views
This is how you model conditional logic as pluggable components.
-------------------------------------------------------------*/
var eventsRouter = new Plumber.Devices.Router()
    .route(filteredView1, function (struct, promise) {
      if(struct.get('type') == 'pageview') promise.resolve()
      else promise.reject()
    })
    .route(filteredView2, function (struct, promise) {
      if(struct.get('type') == 'order') promise.resolve()
      else promise.reject()
    })

/* Activity bar charts for filtered views.
Each real time bar chart is made by piping a capped view to a counter aggregator to another capped view.
-------------------------------------------------------------*/
filteredView1.pipe(new Counter(200)).pipe(cappedView($('#counter1'), 84))
filteredView2.pipe(new Counter(200)).pipe(cappedView($('#counter2'), 84))

/* The totals view aggregates totals for each event type
-------------------------------------------------------------*/
var totals = pieView($('#pie'), 500)

totals.pipe(cappedView($('#totals'), 1))

/* Use a ventilator to forward 1 or more data streams to all devices.
-------------------------------------------------------------*/
new Plumber.Devices.Ventilator(stream, [allView, eventsRouter, totals])

