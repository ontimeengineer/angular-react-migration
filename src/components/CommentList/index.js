import angular from 'angular';
import { reactToAngularComponent } from '../../services/AngularReactHelper';
import CommentList from './presenter';

module.exports = angular.module('xenon-app.commentList', [
]).component('commentList', reactToAngularComponent(CommentList));
