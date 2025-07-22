import angular from 'angular';
import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { mapValues } from 'lodash';

const reactRoots = new WeakMap(); // Track mounted roots per DOM node

function render(element, Component, props) {
    let root = reactRoots.get(element);

    if (!root) {
        root = ReactDOMClient.createRoot(element);
        reactRoots.set(element, root);
    }

    root.render(<Component {...props} />);
}

function unmount(element) {
    const root = reactRoots.get(element);
    if (root) {
        root.unmount();
        reactRoots.delete(element);
    }
}

function toBindings(propTypes) {
    return mapValues(propTypes, () => '<');
}

function toProps(propTypes, controller) {
    return mapValues(propTypes, (_, key) => controller[key]);
}

export function getAngularService(document, name) {
    const injector = angular.element(document.body).injector() || {};
    return injector.get(name);
}

export function reactToAngularComponent(Component) {
    const { propTypes = {} } = Component;

    function controller($scope, $element) {
        this.$onChanges = () =>
            render($element[0], Component, toProps(propTypes, this));

        this.$onDestroy = () =>
            unmount($element[0]);
    }

    controller.$inject = ['$scope', '$element'];

    return {
        bindings: toBindings(propTypes),
        controller,
    };
}
