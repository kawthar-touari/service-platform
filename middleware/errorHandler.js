const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Afficher l'erreur complète dans le terminal
    res.status(500).json({ message: "Une erreur interne est survenue", error: err.message });
};

module.exports = errorHandler;