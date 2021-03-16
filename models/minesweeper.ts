import { List, fromJS } from 'immutable'
import { BehaviorSubject } from 'rxjs'
import { scan, map, switchMap, take, filter } from 'rxjs/operators'

function createRandomArray(
  lower: number,
  upper: number,
  excludes: Set<number>,
  size: number
): Array<number> {
  const samples = new Set<number>()

  while (samples.size < size) {
    const sample = Math.floor((upper - lower) * Math.random()) + lower

    if (!excludes.has(sample)) {
      samples.add(sample)
    }
  }

  return Array.from(samples)
}

type Cell = number | 'mine'

interface View {
  playground: List<List<Cell>>
  nMines: number
  passed: boolean
  failed: boolean
}

export class Minesweeper {
  private visitSubject: BehaviorSubject<[number, number]>
  public readonly view: BehaviorSubject<View>

  constructor(nCols: number, nRows: number, nMines: number) {
    this.visitSubject = new BehaviorSubject<[number, number]>(null)
    const minefields = this.initMinefields(
      nCols,
      nRows,
      nMines,
      this.visitSubject
    )
    const mineNumbers = this.initMineNumbers(minefields)
    const visits = this.initVisits(mineNumbers, this.visitSubject)
    this.view = this.initView(nMines, mineNumbers, visits)
  }

  private initMinefields(
    nCols: number,
    nRows: number,
    nMines: number,
    visitSubject: BehaviorSubject<[number, number]>
  ): BehaviorSubject<List<List<boolean>>> {
    const minefields = Array.from(Array(nCols), () =>
      new Array<boolean>(nRows).fill(false)
    )

    const minefieldsSubject = new BehaviorSubject<List<List<boolean>>>(
      fromJS(minefields)
    )

    visitSubject
      .pipe(
        filter((visit) => !!visit),
        take(1)
      )
      .subscribe(([col, row]) => {
        const minefields = Array.from(Array(nCols), () =>
          new Array<boolean>(nRows).fill(false)
        )

        const mine1DIndices = createRandomArray(
          0,
          nCols * nRows,
          new Set([col * nRows + row]),
          nMines
        )

        for (const index of mine1DIndices) {
          const col = Math.floor(index / nRows)
          const row = index % nRows
          minefields[col][row] = true
        }

        minefieldsSubject.next(fromJS(minefields))
      })

    return minefieldsSubject
  }

  private initMineNumbers(
    minefields: BehaviorSubject<List<List<boolean>>>
  ): BehaviorSubject<List<List<number>>> {
    const subject = new BehaviorSubject<List<List<number>>>(null)

    minefields.subscribe((minefields) => {
      const nCols = minefields.size
      const nRows = minefields.get(0).size
      const mineNumbers = Array.from(Array(nCols), () =>
        new Array<number>(nRows).fill(0)
      )

      for (let col = 0; col < nCols; ++col) {
        for (let row = 0; row < nRows; ++row) {
          const cols = [-1, 0, 1].map((offset) => col + offset)
          const rows = [-1, 0, 1].map((offset) => row + offset)
          const indices = cols.flatMap((col) => rows.map((row) => [col, row]))

          if (minefields.getIn([col, row])) {
            mineNumbers[col][row] = -1
          } else {
            // count the number of neighbor mines
            mineNumbers[col][row] = indices.reduce((count, [col, row]) => {
              return (
                count +
                // skip out of bounds
                (![col, row].includes(-1) && col < nCols && row < nRows
                  ? +minefields.getIn([col, row]) // boolean to number
                  : 0)
              )
            }, 0)
          }
        }
      }

      subject.next(fromJS(mineNumbers))
    })

    return subject
  }

  private initVisits(
    mineNumbers: BehaviorSubject<List<List<number>>>,
    visitSubject: BehaviorSubject<[number, number]>
  ): BehaviorSubject<List<List<boolean>>> {
    const subject = new BehaviorSubject<List<List<boolean>>>(null)

    mineNumbers
      .pipe(
        switchMap((mineNumbers) => {
          const nCols = mineNumbers.size
          const nRows = mineNumbers.get(0).size
          const defaultVisits = List(
            Array.from(Array(nCols), () =>
              List(new Array<boolean>(nRows).fill(false))
            )
          )

          subject.next(defaultVisits)

          return visitSubject.pipe(
            filter((visit) => !!visit),
            scan<[number, number], List<List<boolean>>>(
              (visits, [col, row]) => {
                const visitStack = [[col, row]]

                while (visitStack.length) {
                  const [col, row] = visitStack.pop()
                  if (!visits.getIn([col, row])) {
                    visits = visits.update(col, (colValues) =>
                      colValues.update(row, () => true)
                    )
                    if (mineNumbers.getIn([col, row]) === 0) {
                      const cols = [-1, 0, 1].map((offset) => col + offset)
                      const rows = [-1, 0, 1].map((offset) => row + offset)
                      const indices = cols.flatMap((col) =>
                        rows.map((row) => [col, row])
                      )
                      indices.forEach(([col, row]) => {
                        // skip out of bounds
                        if (
                          ![col, row].includes(-1) &&
                          col < nCols &&
                          row < nRows
                        ) {
                          visitStack.push([col, row])
                        }
                      })
                    }
                  }
                }

                return visits
              },
              defaultVisits
            )
          )
        })
      )
      .subscribe((visits) => {
        subject.next(visits)
      })

    return subject
  }

  private initView(
    nMines: number,
    mineNumbers: BehaviorSubject<List<List<number>>>,
    visits: BehaviorSubject<List<List<boolean>>>
  ): BehaviorSubject<View> {
    const subject = new BehaviorSubject<View>(null)

    mineNumbers.subscribe((mineNumbers) => {
      visits
        .pipe(
          filter((visits) => !!visits),
          map((visits) => {
            const nCols = mineNumbers.size
            const nRows = mineNumbers.get(0).size
            const playground = Array.from(Array(nCols), () =>
              new Array<Cell>(nRows).fill(null)
            )

            let nVisited = 0
            let failed = false

            for (let col = 0; col < nCols; ++col) {
              for (let row = 0; row < nRows; ++row) {
                if (visits.getIn([col, row])) {
                  nVisited += 1

                  if (mineNumbers.getIn([col, row]) === -1) {
                    playground[col][row] = 'mine'
                    failed = true
                  } else {
                    playground[col][row] = mineNumbers.getIn([col, row])
                  }
                }
              }
            }

            let passed = !failed && nCols * nRows - nVisited === nMines

            if (passed || failed) {
              for (let col = 0; col < nCols; ++col) {
                for (let row = 0; row < nRows; ++row) {
                  if (mineNumbers.getIn([col, row]) === -1) {
                    playground[col][row] = 'mine'
                  } else {
                    playground[col][row] = mineNumbers.getIn([col, row])
                  }
                }
              }
            }

            return {
              playground: fromJS(playground),
              nMines,
              passed,
              failed,
            }
          })
        )
        .subscribe((view) => {
          subject.next(view)
        })
    })

    return subject
  }

  public visit(col: number, row: number) {
    this.visitSubject.next([col, row])
  }
}
