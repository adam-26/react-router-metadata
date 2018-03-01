// @flow
import React from 'react';
import PropTypes from 'prop-types';
import invariant from 'invariant';
import hoistNonReactStatic from 'hoist-non-react-statics';
import getDisplayName from 'react-display-name';
import { withRouter } from 'react-router';
import { withMetadata, Metadata, METADATA_PROP_NAME } from 'react-html-metadata';

export const GET_METADATA_METHOD_NAME = 'getMetadata';
export const PRELOAD_METADATA_METHOD_NAME = 'preloadMetadata';

export default function withReactRouterMetadata(options?: {
            mapParamsToProps?: (actionParams: Object, routerCtx: Object) => Object,
            staticMethodName?: string,
            componentStaticMethodName?: string,
            metadataPropName?: string
        } = {}
    ) {
    const {
        mapParamsToProps,
        staticMethodName,
        componentStaticMethodName,
        metadataPropName
    } = Object.assign({
        mapParamsToProps: (params) => params,
        staticMethodName: PRELOAD_METADATA_METHOD_NAME,
        componentStaticMethodName: GET_METADATA_METHOD_NAME,
        metadataPropName: METADATA_PROP_NAME
    }, options);

    return (Component) => {
        const componentName = getDisplayName(Component);
        const getMetadata = Component[componentStaticMethodName];
        invariant(typeof getMetadata === 'function', `Component ${componentName} requires a static function named '${componentStaticMethodName}' to use withReactRouterMetadata().`);

        class ReactRouterMetadata extends React.Component {
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
                    currentMetadata: null
                };
            }

            setMetadata(nextMetadata = null) {
                const { currentMetadata } = this.state;
                const appliedMetadata = this.props.metadata.update(currentMetadata, nextMetadata);

                if (appliedMetadata !== currentMetadata) {
                    this.setState({currentMetadata: appliedMetadata});
                }
            }

            componentWillReceiveProps(nextProps) {
                if (this.props.location === nextProps.location) {
                    // unnecessary to update
                    return;
                }

                // eslint-disable-next-line no-unused-vars
                const { location, match, history, ...props } = nextProps;
                this.setMetadata(getMetadata({ ...props, location, match }));
            }

            componentWillMount() {
                // eslint-disable-next-line no-unused-vars
                const { location, match, history, ...props } = this.props;
                this.setMetadata(getMetadata({ ...props, location, match }));
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
        ReactRouterMetadata[staticMethodName] = function (props, routerCtx) {
            const { [metadataPropName]: htmlMetadata, location, match, ...actionProps } = props;
            if (typeof htmlMetadata === 'undefined') {
                // No htmlMetadata instance, no metadata will be pre-loaded.
                // - this can be used to prevent pre-loading on client renders
                return;
            }

            // Verify valid metadata type
            invariant(htmlMetadata instanceof Metadata, `[react-router-metadata] "${staticMethodName}" requires prop "${metadataPropName}" be an instance of Metadata.`);

            const mappedProps = mapParamsToProps(actionProps, routerCtx);
            htmlMetadata.appendMetadata(getMetadata({ ...mappedProps, location, match }));
        };

        ReactRouterMetadata.displayName = `withReactRouterMetadata(${componentName})`;

        const hoisted = hoistNonReactStatic(ReactRouterMetadata, Component);
        return withRouter(withMetadata('metadata')(hoisted));
    };
}
