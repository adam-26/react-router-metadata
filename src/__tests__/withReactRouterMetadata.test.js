import React from 'react';
import PropTypes from 'prop-types';
import { MemoryRouter } from 'react-router';
import Html, { Metadata } from 'react-html-metadata';
import withReactRouterMetadata from '../withReactRouterMetadata';
import { mount } from './enzyme';

class TestComponent extends React.Component {
    static propTypes = {
        name: PropTypes.string,
        metadata: PropTypes.object
    };

    static getMetadata(/*{location, match}, props*/) {
        return {
            title: 'title'
        };
    }

    render() {
        return this.props.name;
    }
}

describe('withReactRouterMetadata', () => {
    let mapParamsToProps;
    let Component;

    beforeEach(() => {
        mapParamsToProps = jest.fn();
        Component = withReactRouterMetadata({ mapParamsToProps })(TestComponent);
    });

    test('throws if static action method is missing', () => {
       expect(() => withReactRouterMetadata()(() => {})).toThrow();
    });

    test('does not throw when using stateless component', () => {
        const Stateless = () => {};
        Stateless.getMetadata = () => {};

        expect(() => withReactRouterMetadata()(Stateless)).not.toThrow();
    });

    test('static action method does not throw if no \'metadata\' is passed', () => {
        const md = Component.preloadMetadata({}, {}, {});
        expect(md).toBeUndefined();
    });

    test('static action method throws if no \'metadata\' is not an instance of metadata', () => {
        expect(() => Component.preloadMetadata({}, { metadata: {} }, {})).toThrow();
    });

    test('static action method returns metadata', () => {
        const routeProps = { location: { pathname: '/' } };
        const md = Metadata.createNew();
        const actionParams = { metadata: md, other: 'values' };
        const routerCtx = { route: {} };
        const getMdProps = { md: 'props' };

        // Required to mock the getMetadata func
        TestComponent.getMetadata = jest.fn();
        Component = withReactRouterMetadata({ mapParamsToProps })(TestComponent);

        mapParamsToProps.mockReturnValueOnce(getMdProps);
        TestComponent.getMetadata.mockReturnValueOnce({ title: 'TITLE' });

        // Invoke
        Component.preloadMetadata(routeProps, actionParams, routerCtx);

        // Assert expectations
        expect(mapParamsToProps.mock.calls).toHaveLength(1);
        expect(mapParamsToProps.mock.calls[0][0]).toEqual({ other: 'values' });
        expect(mapParamsToProps.mock.calls[0][1]).toEqual(routerCtx);

        expect(TestComponent.getMetadata.mock.calls).toHaveLength(1);
        expect(TestComponent.getMetadata.mock.calls[0][0]).toEqual(routeProps);
        expect(TestComponent.getMetadata.mock.calls[0][1]).toEqual(getMdProps);

        expect(md.getState()).toHaveLength(1);
        expect(md.getState()[0]).toEqual({ title: 'TITLE' });
    });

    test('lifecycle methods invoke metadata update', () => {
        const md = Metadata.createNew({
            title: 'Hello'
        });
        md.update = jest.fn();

        const props = {
            name: 'bob'
        };

        const wrapper = mount(
            <Html metadata={md}>
                <MemoryRouter>
                    <Component {...props} />
                </MemoryRouter>
            </Html>
        );

        expect(md.update.mock.calls).toHaveLength(1);
        expect(wrapper.html()).toBe('<html><head><title>Hello</title></head><body>bob</body></html>');

        // invokes 'componentWillReceiveProps()'
        wrapper.setProps({
           metadata: Metadata.createNew({
               title: 'World'
           })
        });
        expect(md.update.mock.calls).toHaveLength(2);

        // invokes 'componentWillUnmount()'
        wrapper.unmount();
        expect(md.update.mock.calls).toHaveLength(3);
    });
});
