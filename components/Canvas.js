import React, { PropTypes } from 'react'
import Link from './Link'
import Node from './Node'
import NodeSelector from './NodeSelector'
import { Svg } from 'svgx'

const Canvas = ({
  nodes, links,
  height, width,
  hideNodeSelector,
  pinRadius,
  addNode,
  delNode,
  selectLink,
  selectNode,
  addLink,
  draggedLinkId,
  isDraggingLink,
  isDraggingItems,
  dragItems,
  dragLink,
  endDraggingItems,
  endDraggingLink,
  showNodeSelector,
  nodeSelectorX,
  nodeSelectorY,
  nodeSelectorShow,
  nodeSelectorText,
  setNodeSelectorText,
  previousDraggingPoint
}) => {
  return (
  <Svg
    height={height}
    width={width}
    style={{border: '1px solid black'}}
    onMouseDown={hideNodeSelector}
    onDoubleClick={showNodeSelector}
    onMouseMove={isDraggingLink ? dragLink(previousDraggingPoint) : isDraggingItems ? dragItems(previousDraggingPoint) : undefined}
    onMouseUp={isDraggingLink ? endDraggingLink(draggedLinkId) : isDraggingItems ? endDraggingItems : undefined}
  >

    <NodeSelector
      x={nodeSelectorX}
      y={nodeSelectorY}
      text={nodeSelectorText}
      show={nodeSelectorShow}
      changeText={setNodeSelectorText}
      addNode={addNode}
    />

    {nodes.map(
      (node, i) => (
        <Node
          key={i}
          pinRadius={pinRadius}
          addLink={addLink}
          selectNode={selectNode(node.id)}
          delNode={delNode(node.id)}
          endDragging={endDraggingItems}
          isDraggingLink={isDraggingLink}
          endDraggingLink={endDraggingLink}
          draggedLinkId={draggedLinkId}
          {...node}
        />
      )
    )}

    {links.map(
      (link) => (
        <Link
          pinRadius={pinRadius}
          selectLink={selectLink(link.id)}
          key={link.id}
          {...link}
        />
      )
    )}
  </Svg>
)
}

const point = PropTypes.shape({
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired
})

Canvas.propTypes = Object.assign({
  links: PropTypes.array.isRequired,
  nodes: PropTypes.array.isRequired,
  pinRadius: PropTypes.number.isRequired,
  previousDraggingPoint: point
}, Svg.propTypes)

export default Canvas