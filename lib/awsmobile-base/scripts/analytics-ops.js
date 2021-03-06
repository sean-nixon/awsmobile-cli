"use strict";

var inquirer = require('inquirer');
var fs = require('fs');
var mhYamlLib = require('./lib/mh-yaml-lib.js');

// save project info from 
var _projectInfo = {};

var startQuestionary = () => new Promise(
  function(resolve, reject) {
    var currentDefinition = {
      'analytics': {
        enabled: false
      }
    };

    // Read current analytics configuration
    mhYamlLib.load(_projectInfo, (yamlDefinition) => {
      if (yamlDefinition['features']['mobile-analytics'] &&
          yamlDefinition['features']['mobile-analytics']['components'] &&
          yamlDefinition['features']['mobile-analytics']['components']['analytics']) {
        currentDefinition['analytics']['enabled'] = true;
      }
      currentDefinition.yamlDefinition = yamlDefinition;
    });
    resolve(currentDefinition);
  }
);

var askEnableAnalytics = (currentDefinition) => {
  let defaultMessage = 'Currently Amazon Pinpoint analytics is disabled, do you want to enable it?'
  if (currentDefinition['analytics'].enabled) {
    defaultMessage = 'Currently Amazon Pinpoint analytics is enabled, do you want to keep it enabled?'
  }
  var enableQuestion = {
    type: 'confirm',
    name: 'enableAnalytics',
    message: defaultMessage,
    default: true
  }

  return inquirer.prompt(enableQuestion).then(answers => {
    currentDefinition['analytics']['enabled'] = answers.enableAnalytics;
    return currentDefinition;
  });
}

var saveSettings = (currentDefinition) => {

  if (!currentDefinition['analytics']['enabled']) {
    //Remove analytics
    if (currentDefinition.yamlDefinition['features']['mobile-analytics'] && 
        currentDefinition.yamlDefinition['features']['mobile-analytics']['components']) { 
          delete currentDefinition.yamlDefinition['features']['mobile-analytics']['components']['analytics'];
          // Check if there is nothing else enabled on mobile-analytics
          if (Object.keys(currentDefinition.yamlDefinition['features']['mobile-analytics']['components']).length === 0) {
            // remove mobile-analytics
            delete currentDefinition.yamlDefinition['features']['mobile-analytics'];
          }
    }

  } else {

    if (!currentDefinition.yamlDefinition['features']['mobile-analytics'] ) {
      // mobile-analytics not created
      currentDefinition.yamlDefinition['features']['mobile-analytics'] =
        new mhYamlLib.Pinpoint({components: {}});
    }
    currentDefinition.yamlDefinition['features']['mobile-analytics']['components']['analytics'] =
      new mhYamlLib.PinpointAnalytics();
  }
  let yaml = currentDefinition.yamlDefinition;
  
  mhYamlLib.save(_projectInfo, yaml, () => {});
  return Promise.resolve(currentDefinition);
}

exports.specify = (projectInfo) => {
    _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo
  return new Promise(function(resolve,reject) {
      startQuestionary()
      .then(askEnableAnalytics)
      .then(saveSettings)
      .then(resolve)
      .catch(reject);
  });
}

exports.onFeatureTurnOn = function(projectInfo, cloudProjectSpec){
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo  
}

exports.onFeatureTurnOff = function(projectInfo, cloudProjectSpec){
  _projectInfo = JSON.parse(JSON.stringify(projectInfo)); // clone projectInfo
  
}