/**
 * Converts relay subscription query to Graph.cool subscription query by replacing edges with nodes.
 *
 * @param query Relay subscription query
 *
 * @returns {Object}
 * @property {String} query
 * @property {Function} graphcoolToRelayPayload
 */
export function relayToGraphcoolSubscription (query) {
  const regex = /^(\s*subscription\s+\w+\s+\{\s*(\w+)(?:\([^\)]*\))?\s*\{\s*(?:\w+\s+)*)(edge\s*\{\s*)(node\s*\{[^\}]*\}\s*)(\}\s*)((?:\w+\s+)*\}\s*\}\s*)$/;

  const matches = query.match(regex);
  if (matches) {
    const start = matches[1];
    const name = matches[2];
    const node = matches[4];
    const end = matches[6];

    return {
      query: start + node + end,
      graphcoolToRelayPayload: (data) => {
        const { node, ...rest } = data[name];
        return {
          [name]: {
            edge: {
              node
            },
            ...rest,
          }
        };
      },
    };

  } else {
    return {
      query,
      graphcoolToRelayPayload: (data) => data,
    };
  }
}
