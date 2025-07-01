import express from "express";

const orderRoute =express.Router();

orderRoute.route("/")
                .get()
                .post()
orderRoute.route("/:orderId")
                .delete()
                .patch()
                .put()
                .get()

export default orderRoute ;