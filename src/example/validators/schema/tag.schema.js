const Joi = require('joi')

const create = Joi.object({
  user_id: Joi.string().uuid().required(),
  name: Joi.string()
    .required()
    .min(1)
    .max(16)
    .pattern(/^[a-z0-9-]+$/)
    .message('"name" must only contain lowercase letters, numbers and hyphens'),
  created_at: Joi.string().isoDate().required(),
  updated_at: Joi.string().isoDate().required()
}).options({ allowUnknown: false, stripUnknown: true })

const update = Joi.object({
  id: Joi.number().required(),
  user_id: Joi.string().uuid().required(),
  name: Joi.string()
    .min(1)
    .max(16)
    .pattern(/^[a-z0-9-]+$/)
    .message('"name" must only contain lowercase letters, numbers and hyphens'),
  updated_at: Joi.string().isoDate().required()
}).options({ allowUnknown: false, stripUnknown: true })

module.exports = {
  create,
  update
}
