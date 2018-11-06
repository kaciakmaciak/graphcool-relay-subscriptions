#!/usr/bin/env node

'use strict';

const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');
const chalk = require('chalk');
const {
  buildClientSchema,
  introspectionQuery,
  printSchema
} = require('graphql/utilities');


const argv = require('minimist')(process.argv.slice(2), { boolean: false });
let relayUrl = argv.relay || convertUrl(argv.simple, 'relay') || constructUrl(argv._[0], 'relay');
let simpleUrl = argv.simple || convertUrl(argv.relay, 'simple') || constructUrl(argv._[0], 'simple');

Promise.all([
  downloadSchema(relayUrl),
  downloadSchema(simpleUrl),
]).then(([relay, subscriptions]) => {
  updateSchema(relay, subscriptions);
  const schemaString = printSchema(buildClientSchema({ __schema: relay }));
  fs.writeFileSync('schema.graphql', schemaString);

  console.log('\nschema.graphql has been downloaded and saved.');
});


function convertUrl (url, type) {
  const types = ['simple', 'relay'];
  return url && url.replace(new RegExp(`\/${types[(types.indexOf(type) + 1) % types.length]}\/`), `/${type}/`);
}

function constructUrl (hash, type) {
  return `https://api.graph.cool/${type}/${hash}`;
}

function isURL(str) {
  const urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]' +
    '\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]' +
    '\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)' +
    '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]' +
    '{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
  const url = new RegExp(urlRegex, 'i');
  return str.length < 2083 && url.test(str);
}

function downloadSchema (url) {
  if (!isURL(url)) {
    console.log(chalk.red(url) + ' is not a valid url');
    process.exit(1);
  }

  console.log('Downloading for url: ' + chalk.green(url));

  return fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({query: introspectionQuery}),
  })
    .then(res => {
      if (res.status >= 400) {
        let err = new Error(res.statusText);
        err.status = res.status;
        throw err;
      }
      return res;
    })
    .then(res => res.json())
    .then(res => res.data.__schema)
    .catch(e => {
      console.log(chalk.red('\nError:'));
      console.error(e);
      process.exit(1);
    });
}

function updateSchema (schema, subsSchema) {
  if (!subsSchema.subscriptionType) {
    console.log(chalk.red('Error:' ) + 'subscription schema must include subscription type.');
  }

  const subsFields = findType(subsSchema, subsSchema.subscriptionType.name).fields;
  const subsPayloads = subsFields.map(field => field.type.name);

  subsPayloads.forEach(t => {
    wrapNodeIntoEdge(findType(subsSchema, t));
  });

  schema.subscriptionType = subsSchema.subscriptionType;
  subsSchema.types.forEach(subsType => {
    includeType(schema, subsType);
  });
}

function findType (schema, typeName) {
  return schema.types.find(({ name }) => name === typeName);
}

function includeType (schema, type) {
  const i = schema.types.findIndex(({ name }) => type.name === name);
  if (i === -1) {
    schema.types.push(type);
  }
}

function wrapNodeIntoEdge (type) {
  const nodeIndex = type.fields.findIndex(({ name }) => name === 'node');

  type.fields[nodeIndex].name = 'edge';
  type.fields[nodeIndex].type.name = type.fields[nodeIndex].type.name + 'Edge';
}
