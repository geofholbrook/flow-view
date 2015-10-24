
/**
 * Create new nodes.
 *
 * Datalist feature stolen from article: http://blog.teamtreehouse.com/creating-autocomplete-dropdowns-datalist-element
 * and this codepen: http://codepen.io/matt-west/pen/jKnzG
 *
 * @param {Object} canvas
 * @param {String} dataListURL containing datalist entries
 */

function NodeSelector (canvas, dataListURL) {
  var x = 0
  this.x = x

  var y = 0
  this.y = y

  var foreignObject = canvas.svg.foreignObject(100, 100)
                            .attr({id: 'flow-view-selector'})

  foreignObject.appendChild('form', {id: 'flow-view-selector-form', name: 'nodeselector'})

  var form = foreignObject.getChild(0)

  var selectorInput = document.createElement('input')

  selectorInput.id = 'flow-view-selector-input'
  selectorInput.name = 'selectnode'
  selectorInput.type = 'text'

  function addOption (dataList, item) {
    var option = document.createElement('option')

    option.value = item

    dataList.appendChild(option)
  }

  function populateDataList (dataList, request) {
    if (request.readyState === 4) {
      if (request.status === 200) {

      var jsonOptions = JSON.parse(request.responseText)

      jsonOptions.forEach(addOption.bind(dataList))

      input.placeholder = ''
    }
    else {
      // On error, notify in placeholder.
      input.placeholder = 'Could not load datalist :)';
    }
  }

  }

  if (typeof dataListURL === 'string') {
    selectorInput.placeholder = 'Loading ...'

    var dataList = document.createElement('datalist')

    dataList.id = 'flow-view-selector-list'

    selectorInput.appendChild(dataList)

    var request = new XMLHttpRequest()

    request.onreadystatechange = function (request) {
      populateDataList(dataList, request)
    }

    request.open('GET', dataListURL, true)
    request.send()
  }

  form.appendChild(selectorInput)

  function createNode () {
    foreignObject.hide()

    var inputText = document.getElementById('flow-view-selector-input')

    var nodeName = inputText.value

    var nodeView = {
      text: nodeName,
      x: this.x,
      y: this.y
    }

    canvas.broker.emit('addNode', nodeView)

    // Remove input text, so next time node selector is shown empty again.
    inputText.value = ''

    // It is required to return false to have a form with no action.
    return false
  }

  form.onsubmit = createNode.bind(this)

  // Start hidden.
  foreignObject.attr({width: 200, height: 100})
               .move(x, y)
               .hide()

  this.foreignObject = foreignObject
}

function hide (ev) {
  this.foreignObject.hide()
}

NodeSelector.prototype.hide = hide

function show (ev) {
  var x = ev.offsetX,
      y = ev.offsetY

  var foreignObject = this.foreignObject

  this.x = x
  this.y = y

  foreignObject.move(x, y)
               .show()

  var form = foreignObject.getChild(0)
  form.selectnode.focus()
}

NodeSelector.prototype.show = show

module.exports = NodeSelector
