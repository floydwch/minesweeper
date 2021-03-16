import { Observable } from 'rxjs'
import { takeLast } from 'rxjs/operators'
import { fromJS } from 'immutable'

import { Minesweeper } from './minesweeper'

test('init a game of Minesweeper', (done) => {
  const nCols = 6
  const nRows = 6
  const nMines = 5
  const minesweeper = new Minesweeper(nCols, nRows, nMines)

  minesweeper.view.subscribe((view) => {
    expect(view.nMines).toBe(nMines)
    expect(view.passed).toBe(false)
    expect(view.failed).toBe(false)
    expect(view.playground).toEqual(
      fromJS(Array.from(Array(nCols), () => new Array(nRows).fill(null)))
    )
    done()
  })
})

test("first click won't be a mine", (done) => {
  const size = 6
  const nMines = 35

  new Observable((subscriber) => {
    for (let i = 0; i < size; ++i) {
      const minesweeper = new Minesweeper(size, size, nMines)

      minesweeper.view.pipe(takeLast(1)).subscribe((view) => {
        expect(view.failed).toEqual(false)
        expect(view.playground.getIn([i, i])).not.toBe('mine')
        expect(view.playground.getIn([i, i])).toBeGreaterThanOrEqual(3)
      })

      minesweeper.visit(i, i)
      minesweeper.view.complete()
    }
    subscriber.next()
  }).subscribe(done)
})

test('visiting a cell with a mine ends the game', (done) => {
  const nCols = 2
  const nRows = 2
  const nMines = 3
  const minesweeper = new Minesweeper(nCols, nRows, nMines)

  minesweeper.view.pipe(takeLast(1)).subscribe((view) => {
    expect(view.passed).toBe(false)
    expect(view.failed).toBe(true)
  })

  minesweeper.visit(0, 0)
  minesweeper.visit(1, 1)
  minesweeper.view.complete()

  done()
})

test('visiting a cell with adjacent mines shows the number of mines touching it', (done) => {
  let minesweeper = new Minesweeper(3, 3, 1)

  minesweeper.view.pipe(takeLast(1)).subscribe((view) => {
    expect(view.playground.getIn([1, 1])).toBe(1)
  })

  minesweeper.visit(1, 1)
  minesweeper.view.complete()

  minesweeper = new Minesweeper(3, 3, 3)

  minesweeper.view.pipe(takeLast(1)).subscribe((view) => {
    expect(view.playground.getIn([1, 1])).toBe(3)
  })

  minesweeper.visit(1, 1)
  minesweeper.view.complete()

  done()
})

test('visiting a cell with no adjacent mine visits all adjacent cells', (done) => {
  new Observable((subscriber) => {
    while (true) {
      const size = 9
      const center = Math.floor(size / 2)
      const minesweeper = new Minesweeper(size, size, 1)
      let withAdjacentMines = false

      minesweeper.view.pipe(takeLast(1)).subscribe((view) => {
        if (view.playground.getIn([center, center]) > 0) {
          withAdjacentMines = true
        } else {
          for (let col = 0; col < size; ++col) {
            for (let row = 0; row < size; ++row) {
              if (view.playground.getIn([col, row]) === 0) {
                const cols = [-1, 0, 1].map((offset) => col + offset)
                const rows = [-1, 0, 1].map((offset) => row + offset)
                const indices = cols.flatMap((col) =>
                  rows.map((row) => [col, row])
                )
                indices.forEach(([col, row]) => {
                  if (![col, row].includes(-1) && col < size && row < size) {
                    expect(view.playground.getIn([col, row])).not.toBe(null)
                  }
                })
              }
            }
          }
        }
      })

      minesweeper.visit(center, center)
      minesweeper.view.complete()

      if (!withAdjacentMines) {
        break
      }
    }
    subscriber.next()
  }).subscribe(done)
})
