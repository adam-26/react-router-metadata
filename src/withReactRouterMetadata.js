// @flow
import React from 'react';
import PropTypes from 'prop-types';
import invariant from 'invariant';
import hoistNonReactStatic from 'hoist-non-react-statics';
import getDisplayName from 'react-display-name';
import { withRouter } from 'react-router';
import { withMetadata, Metadata, METADATA_ACTION_PARAM_NAME } from 'react-html-metadata';

export const GET_METADATA_METHOD_NAME = 'getMetadata';
export const METADATA_ACTION_NAME = 'preloadMetadata';

const withReactRouterMetadata = (
        mapParamsToProps?: (actionParams: Object, routerCtx: Object) => Object = (params) => params,
        options?: {
            metadataActionName?: string,
            staticMethodName?: string,
            actionParamName?: string
        } = {
            metadataActionName: METADATA_ACTION_NAME,
            staticMethodName: GET_METADATA_METHOD_NAME,
            actionParamName: METADATA_ACTION_PARAM_NAME
        }
    ) => {
    return (Component) => {
        const componentName = getDisplayName(Component);
        const getMetadata = Component[options.staticMethodName];
        invariant(typeof getMetadata === 'function', `Component ${componentName} requires a static function named '${options.staticMethodName}' to use withReactRouterMetadata().`);

        class ReactRouterMetadata extends Component {
            static propTypes = {
                // react-router props
                match: PropTypes.object,
                location: PropTypes.object,
                history: PropTypes.object,

                // react-html-metadata
                metadata: PropTypes.object
            };

            constructor(props, context) {
                super(props, context);
                this.state = {
                    currentMetadata: {}
                };
            }

            setMetadata(nextMetadata = null) {
                this.props.metadata.update(this.state.currentMetadata, nextMetadata || {});
                if (nextMetadata !== null) {
                    this.setState({ currentMetadata: nextMetadata });
                }
            }

            componentWillReceiveProps(nextProps) {
                // eslint-disable-next-line no-unused-vars
                const { location, match, history, ...props } = nextProps;
                this.setMetadata(getMetadata({ location, match }, props));
            }

            componentWillMount() {
                // eslint-disable-next-line no-unused-vars
                const { location, match, history, ...props } = this.props;
                this.setMetadata(getMetadata({ location, match }, props));
            }

            componentWillUnmount() {
                this.setMetadata();
            }

            render() {
                const {
                    // Do not delete these props, easiest method to extract component props
                    /* eslint-disable no-unused-vars */
                    match,
                    location,
                    history,
                    metadata,
                    /* eslint-enable no-unused-vars */
                    ...componentProps
                } = this.props;
                return <Component {...componentProps} />;
            }
        }

        // Static action method, using name as defined in options
        ReactRouterMetadata[options.metadataActionName] = function (routeProps, actionParams, routerCtx) {
            const { [options.actionParamName]: htmlMetadata, ...params } = actionParams;
            if (typeof htmlMetadata === 'undefined') {
                // No htmlMetadata instance, no metadata will be pre-loaded.
                // - this can be used to prevent pre-loading on client renders
                return;
            }

            // Verify valid metadata type
            invariant(htmlMetadata instanceof Metadata, `actionParams requires prop ${options.actionParamName} to be an instance of Metadata.`);

            const props = mapParamsToProps(params, routerCtx);
            htmlMetadata.appendMetadata(getMetadata(routeProps, props));
        };

        ReactRouterMetadata.displayName = `withReactRouterMetadata(${componentName})`;

        const hoisted = hoistNonReactStatic(ReactRouterMetadata, Component);
        return withRouter(withMetadata('metadata')(hoisted));
    };
};

export default withReactRouterMetadata;
