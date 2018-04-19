const Errors = require('./errors');

const Db = {

  storage: {},

  get(id){

    return Db.storage[id];

  },

  add(id, content){

    Db.storage[id] = content;

  },

  removeByProp(prop, value){

    const id = Object.keys(Db.storage)
      .find(id => Db.storage[id][prop] === value);

    if(!id){

      Errors.throwError('Cannot find entry', { prop, value });

    }

    return delete Db.storage[id];

  },

  clear(){

    Db.storage = {};

  }

};

module.exports = Db;
