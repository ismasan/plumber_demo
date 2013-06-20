rivets.binders.height = function(el, value) {
  el.style.height = value + 'px'
}

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
























////////////////////////////////////////////////////

var index = new Plumber.Devices.CappedIndex()

var stream = new MockStream()

var allView = cappedView($('#all'), 24)

var filter1 = cappedView($('#filter1'), 10)
var filter2 = cappedView($('#filter2'), 10)

// stream.on('add', function(i){
//   console.log('add', i)
// })

var detailView = cappedView($('#detail'), 1)

var eventsRouter = new Plumber.Devices.Router()
    .route(filter1, function (struct, promise) {
      if(struct.get('type') == 'pageview') promise.resolve()
      else promise.reject()
    })
    .route(filter2, function (struct, promise) {
      if(struct.get('type') == 'order') promise.resolve()
      else promise.reject()
    })

filter1.pipe(new Counter(200)).pipe(cappedView($('#counter1'), 84))
filter2.pipe(new Counter(200)).pipe(cappedView($('#counter2'), 84))

var totals = pieView($('#pie'), 500)

totals.pipe(cappedView($('#totals'), 1))

new Plumber.Devices.Ventilator(stream, [allView, eventsRouter, totals])

