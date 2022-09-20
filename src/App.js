import React, { useCallback, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useImmer } from 'use-immer';

const TableRow = ({ data, moveCard, index, id }) => {
	const ref = useRef(null);
	const [{ handlerId }, dropRef] = useDrop({
		accept: 'list',
		collect(monitor) {
			return {
				handlerId: monitor.getHandlerId(),
			};
		},
		hover(item, monitor) {
			if (!ref.current) {
				return;
			}
			const dragIndex = item.index;
			const hoverIndex = index;
			// Don't replace items with themselves
			if (dragIndex === hoverIndex) {
				return;
			}
			// Determine rectangle on screen
			const hoverBoundingRect = ref.current?.getBoundingClientRect();
			// Get vertical middle
			const hoverMiddleY =
				(hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
			// Determine mouse position
			const clientOffset = monitor.getClientOffset();
			// Get pixels to the top
			const hoverClientY = clientOffset.y - hoverBoundingRect.top;
			// Only perform the move when the mouse has crossed half of the items height
			// When dragging downwards, only move when the cursor is below 50%
			// When dragging upwards, only move when the cursor is above 50%
			// Dragging downwards
			if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
				return;
			}
			// Dragging upwards
			if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
				return;
			}
			// Time to actually perform the action
			moveCard(dragIndex, hoverIndex);
			// Note: we're mutating the monitor item here!
			// Generally it's better to avoid mutations,
			// but it's good here for the sake of performance
			// to avoid expensive index searches.
			item.index = hoverIndex;
		},
	});
	const [{ isDragging }, drag] = useDrag({
		type: 'list',
		item: () => {
			return { id, index };
		},
		collect: monitor => ({
			isDragging: monitor.isDragging(),
		}),
	});
	const opacity = isDragging ? 0.5 : 1;
	drag(dropRef(ref));
	return (
		<tr ref={ref} style={{ opacity }} data-handler-id={handlerId}>
			<td>{data.title}</td>
		</tr>
	);
};

function App() {
	const [data, setData] = useImmer([]);

	const moveCard = useCallback(
		(dragIndex, hoverIndex) => {
			setData(prevCards => {
				const temp = prevCards[dragIndex];
				prevCards[dragIndex] = prevCards[hoverIndex];
				prevCards[hoverIndex] = temp;
				/* 	prevCards.splice(dragIndex, 1);
				prevCards.splice(hoverIndex, 0, prevCards[dragIndex]); */
			});
		},
		[setData]
	);

	useEffect(() => {
		(async () => {
			const response = await fetch(
				'https://jsonplaceholder.typicode.com/todos/?_page=1&_size=10'
			);
			const data = await response.json();
			setData(data);
		})();
	}, []);

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="App">
				{data && (
					<table>
						<tbody>
							{data.map((row, index) => (
								<TableRow
									id={row.userId}
									data={row}
									key={row.userId + index}
									moveCard={moveCard}
									index={index}
								/>
							))}
						</tbody>
					</table>
				)}
			</div>
		</DndProvider>
	);
}

export default App;
