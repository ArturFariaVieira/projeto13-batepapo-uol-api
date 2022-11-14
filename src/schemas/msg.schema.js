import Joi from "joi"
const msgschema = Joi.object( {
    to: Joi.string().required().min(1),
    text: Joi.string().required().min(1),
    type: Joi.valid("message", "private_message")
})

export default msgschema;