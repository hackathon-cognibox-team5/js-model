var attributeObjDefinition = {};

function buildUrl(resourceName, resourceId) {
  var url = "/" + pluralize(resourceName);

  if (resourceId) {
    url = url + "/" + resourceId;
  }

  return _.toLower(url);
};

function createAttribute(properties) {
  var attrObject = _.extend({
    previousValue: undefined,
    setPreviousValue: function(value) {
      this.previousValue = value || this.value;
    }
  }, properties);

  var attrObjValue;
  Object.defineProperty(attrObject, 'value', {
    get: function() {
      return attrObjValue;
    },
    set: function(value) {
      attrObjValue = value;
    }
  });

  return attrObject;
};

var JsModel = {
  attrs: {},

  // Model.create({ id: 1 })
  create: function(properties, options) {
    var obj = _.extend({}, this.$instance);

    obj.attrs = _.extend({}, this.attrs);
    _.each(obj.attrs, function(value, key) {
      obj.attrs[key] = createAttribute(value);
    });

    _.each(properties, function(value, key) {
      obj.attrs[key].value = value;
      obj.attrs[key].setPreviousValue();
    });

    return obj;
  },

  /*
    var User = Model.extend({
      name: "User"
    }, {
      fullName: function() { return this.firstName + this.lastName; }
    }, {
      get: function(options) { return this.sync("read", null, options); }
    });
  */
  extend: function(configuration, instanceMethods, classMethods) {
    var instanceObj = _.extend({}, this.$instance, classMethods);
    var classObj = _.extend({}, this, classMethods);

    instanceObj.$class = classObj;
    classObj.$instance = instanceObj;

    if (!configuration) configuration = {};

    if (configuration.attrs) {
      _.each(configuration.attrs, function(value, key) {
        classObj.attrs[key] = _.extend({}, attributeObjDefinition, value);
      });
    }

    if (configuration.name) {
      classObj.name = configuration.name;
      instanceObj.name = configuration.name;
    }

    return classObj;
  },

  fetchAll: function() {
    return fetch(this.url())
      .then(function(response) {
        return response.json()
      }
    );
  },

  fetchOne: function(id) {
    return fetch(this.url(id))
      .then(function(response) {
        return response.json()
      }
    );
  },

  url: function(id) {
    return buildUrl(this.name, id);
  }
};

JsModel.$instance = {
  $class: JsModel,

  attrs: {},

  fetch: function() {
    return this.$class.fetchOne(this.attrs.id.value);
  },

  primaryKey: function() {
    var primaryKey = _.findKey(this.attrs, { primary: true });
    return (primaryKey && this.attrs[primaryKey].value) || this.attrs.id.value;
  },

  url: function() {
    return buildUrl(this.name, this.primaryKey());
  }
};
