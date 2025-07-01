import express from "express";

const paymentRoute =express.Router();

paymentRoute.route("/")
                .get()
                .post()
paymentRoute.route("/:paymentId")
                .delete()
                .patch()
                .put()
                .get()

export default paymentRoute ;