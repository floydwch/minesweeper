This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Start the server:

```bash
yarn
yarn build
yarn start
```

## Test

```bash
yarn test
```

## Explanation

The game of Minesweeper is an instance of state machines. All the states can be derived from the user's inputs. The game displays a view with discovered numbers of adjacent mines or indicators of mines which can be composed with the grid of numbers of adjacent mines and the user's visit history. The user's visit history is also a grid that records if a square has been visited.

The rest information can be derived from the view such as the status of a pass or a fail.

To implement a state machine, one can choose OOP to model the state and the actions. However, this approach might be error-prone because it has to handle a set of variables across different actions.

This project chooses functional reactive programming (FRP) to model the state and actions. As mentioned above, all the states in the game can be derived from the history of the user's inputs (visits). The grid of minefields can be made after the first visit is observed. The grid of numbers of adjacent mines can be derived from the grid of minefields. The final view can be composed with the above grid and the grid of visits.
