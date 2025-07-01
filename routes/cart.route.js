import express from "express";

const cartRoute =express.Router();

cartRoute.route("/")
                .get()
                .post()
cartRoute.route("/:cartId")
                .delete()
                .patch()
                .put()
                .get()

export default cartRoute ;