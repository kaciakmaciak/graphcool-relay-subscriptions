## graphcool-relay-subscriptions

Adds support for using Graph.cool subscriptions in Relay.

### Install

`npm install --save graphcool-relay-subscriptions`

### Usage

#### In Relay Environment

```js
// ...
import { relayToGraphcoolSubscription } from 'graphcool-relay-subscriptions';

// ...

const network = new Network.create(
  function fetchQuery () {
    // ...
  },
  function setupSubscription (operation, variables = {}, cacheConfig, observer) {
    // convert subscription query to graph.cool format
    const { query, graphcoolToRelayPayload } = relayToGraphcoolSubscription(operation.text);

    // setup connection somehow
    // ...

    // use converted query
    connect(query, variables).subscribe((data) => {
      // convert data back to relay format
      observer.onNext({ data: graphcoolToRelayPayload(data) });
    });
  }
)
```

Then you can do:

```graphql
subscription CreatePostSubscription {
    Post(filter: {
        mutation_in: [CREATED]
    }) {
        edge {
            node {
                id
                description
                imageUrl
            }
        }
    }
}
```

#### Download schema

In your `package.json`:

```json
  "scripts": {
     "get-schema": "get-schema <graphcool-api-enpoint-url> [--output=<file-name>]"
  }
```

Then run:

`npm run get-schema` to download schema to specified file (or `schema.graphql` by default).

### Licence

Copyright 2018 Katarina Anton

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.