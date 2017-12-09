# react-router-metadata

[![npm](https://img.shields.io/npm/v/react-router-metadata.svg)](https://www.npmjs.com/package/react-router-metadata)
[![npm](https://img.shields.io/npm/dm/react-router-metadata.svg)](https://www.npmjs.com/package/react-router-metadata)
[![CircleCI branch](https://img.shields.io/circleci/project/github/adam-26/react-router-metadata/master.svg)](https://circleci.com/gh/adam-26/react-router-metadata/tree/master)
[![Code Climate](https://img.shields.io/codeclimate/coverage/github/adam-26/react-router-metadata.svg)](https://codeclimate.com/github/adam-26/react-router-metadata)
[![Code Climate](https://img.shields.io/codeclimate/github/adam-26/react-router-metadata.svg)](https://codeclimate.com/github/adam-26/react-router-metadata)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

Assigns HTML metadata to [react-router-config](https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config) routes using static functions.

Internally, [react-html-metadata](https://github.com/adam-26/react-html-metadata) is used to support the use of metadata with the react SSR stream interface, for more information
about how to define metadata you should view that packages [readme file](https://github.com/adam-26/react-html-metadata).

### Usage

This package is intended to be used with other packages that invoke the static metadata methods.

**You should use one of the current implementations**:

  * [react-router-dispatcher-metadata](https://github.com/adam-26/react-router-dispatcher-metadata)

#### Defining metadata


```js
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withReactRouterMetadata } from 'react-router-metadata';

class MetadataDemo extends Component {

  static propTypes = {
    name: PropTypes.string
  };

  static getMetadata(routeProps, props) {
    const { location, match } = routeProps;
    const { name } = props;

    // Return the metadata
    // see react-html-metadata docs for permitted syntax
    return {
      title: `Welcome ${name}`
    };
  }

  render() {
    return <div>`Hello ${this.props.name}`</div>
  }
}

// This function is used to map `params` to match the component `props`
// Other packages use this to resolve params to props
const mapParamsToProps(params, routerCtx) => {
  const { store } = params;

  // Return the component `props`
  return {
    name: store.user.name
  };
};

export default withReactRouterMetadata(mapParamsToProps)(MetadataDemo);

```


### Install

#### NPM

```js
npm install --save react-router-metadata
```

#### Yarn

```js
yarn add react-router-metadata
```

### API

`withReactRouterMetadata(mapParamsToProps, options)`

#### Parameters

##### `mapParamsToProps`: Optional

`(params: Object, routerCtx: { route: Object, routeComponentKey: string }) => Object`

Optionally, use a function that maps parameters to match the component props.

This is **only required if your `getMetadata` implementation uses prop values**.

##### `options`

* `metadataActionName?: string`:

* The static _method name_ that **must** be invoked on the component before render.

* **default**: preloadMetadata

`staticMethodName?: string`

* The static _method name_ that **must** be implemented by the developer to return metadata.

* **default**: getMetadata

`actionParamName?: string`

* The _name_  (or key) used by the action parameters to store the **metadata** instance

* **default**: metadata

### Contribute
For questions or issues, please [open an issue](https://github.com/adam-26/react-html-metadata/issues), and you're welcome to submit a PR for bug fixes and feature requests.

Before submitting a PR, ensure you run `npm test` to verify that your coe adheres to the configured lint rules and passes all tests. Be sure to include unit tests for any code changes or additions.

### License
MIT