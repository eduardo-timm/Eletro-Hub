// Express 4 nao captura rejeicoes de handlers async; repassa o erro para o middleware de erro do app.js.
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
