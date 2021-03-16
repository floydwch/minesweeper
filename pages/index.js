import { useEffect, useMemo } from 'react'
import { useObservable, useEventCallback } from 'rxjs-hooks'
import { map } from 'rxjs/operators'
import styled from '@emotion/styled'

import { Minesweeper } from '../models/minesweeper'

const Page = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 1024px;
  min-height: 100vh;
  margin: 0 auto;
`

const Playground = styled.div`
  display: grid;
  grid-template-columns: repeat(9, 40px);
`

const Cell = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgb(238, 238, 238);
`

const Status = styled.div`
  margin: 24px auto;
`

export default function Home() {
  const size = 6
  const nMines = 5
  const minesweeper = useMemo(() => new Minesweeper(size, size, nMines), [])
  const view = useObservable(() => minesweeper.view)

  const [clickHandler, targetIndex] = useEventCallback((event) =>
    event.pipe(map((event) => event.target.dataset.index))
  )

  useEffect(() => {
    if (targetIndex !== null) {
      const col = Math.floor(targetIndex / size)
      const row = targetIndex % size
      minesweeper.visit(col, row)
    }
  }, [targetIndex])

  if (view) {
    const cells = Array.from(
      view.playground.flatMap((col) => col.values()).values()
    ).map((cell, index) => {
      if (cell === 'mine') {
        var content = 'X'
      } else {
        var content = cell
      }
      return (
        <Cell key={index} data-index={index}>
          {content}
        </Cell>
      )
    })

    if (view.passed) {
      var status = 'Passed!'
    } else if (view.failed) {
      var status = 'Failed!'
    } else {
      var status = `Game started! ${nMines} mines.`
    }

    return (
      <Page>
        <Status>{status}</Status>
        <Playground
          style={{ gridTemplateColumns: `repeat(${size}, 40px)` }}
          onClick={(e) => {
            if (!(view.passed || view.failed)) {
              clickHandler(e)
            }
          }}
        >
          {cells}
        </Playground>
      </Page>
    )
  } else {
    return null
  }
}
