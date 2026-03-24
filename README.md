# stack-sticky

Auto-stack `position: sticky` elements across nested scroll containers.

## Install

```bash
npm install stack-sticky
```

## Usage

```ts
import { stackSticky } from 'stack-sticky'

stackSticky()

stackSticky({
  type: 'top',
  root: document,
  selector: '.position-sticky:visible, .sticky-top:visible',
  offset: 0
})
```

## API

### `stackSticky(options?)`

- `type`: `'top' | 'bottom' | 'left' | 'right'`, default `'top'`
- `root`: `string | ParentNode`, default `document`
- `selector`: `string`, default `.position-sticky:visible, .sticky-top:visible`
- `offset`: `number`, default `0`

## Development

```bash
pnpm install
pnpm dev
pnpm build
pnpm build:demo
pnpm lint
pnpm check
```

## Demo Build

```bash
pnpm build:demo
pnpm preview
```

## Publish

```bash
pnpm login
pnpm build
pnpm publish --access public
```
