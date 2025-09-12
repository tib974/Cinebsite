<?php
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();

// Helper function to render a view
function render(Response $response, $template, $args = []) {
    ob_start();
    require __DIR__ . '/../views/' . $template . '.php';
    $html = ob_get_clean();
    $response->getBody()->write($html);
    return $response;
}

$app->get('/', function (Request $request, Response $response, $args) {
    return render($response, 'home');
});

$app->get('/contact', function (Request $request, Response $response, $args) {
    return render($response, 'contact');
});

$app->get('/services', function (Request $request, Response $response, $args) {
    return render($response, 'services');
});

$app->get('/packs', function (Request $request, Response $response, $args) {
    return render($response, 'packs');
});

$app->get('/calendrier', function (Request $request, Response $response, $args) {
    return render($response, 'calendrier');
});

$app->get('/apropos', function (Request $request, Response $response, $args) {
    return render($response, 'apropos');
});

$app->get('/realisations', function (Request $request, Response $response, $args) {
    return render($response, 'realisations');
});

// API route for the catalog
$app->get('/api/catalog', function (Request $request, Response $response, $args) {
    $pdo = get_db();
    $stmt = $pdo->query('SELECT * FROM products');
    $products = $stmt->fetchAll();

    $output = array_map(function($p) {
        $type = !empty($p['includes']) && $p['includes'] !== '""' ? 'pack' : 'product';
        $includes = str_replace(['\\', '"'], '', $p['includes']);

        return [
            'id' => $p['id'],
            'slug' => $p['slug'],
            'name' => $p['name'],
            'description' => $p['description'],
            'price_eur_day' => $p['price'],
            'image' => $p['image'],
            'category' => $p['tags'],
            'includes' => $includes,
            'featured' => false, // This needs to be implemented properly later
            'type' => $type
        ];
    }, $products);

    $response->getBody()->write(json_encode(['ok' => true, 'data' => $output]));
    return $response->withHeader('Content-Type', 'application/json');
});


$app->run();