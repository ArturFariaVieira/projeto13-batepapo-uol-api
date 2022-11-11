import Joi from "joi"
const userschema = Joi.object( {
    name: Joi.string().required().min(1),
})

export default userschema;