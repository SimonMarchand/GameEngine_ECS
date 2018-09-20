// # Fonctions d'affichage
// Méthodes nécessaires pour charger et afficher
// des images à l'écran.
define("src/graphicsAPI", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ## Variable *ctx*
    // Représente le contexte de rendu, où s'exécutent
    // les commandes pour contrôller l'affichage
    let ctx;
    // ## Variable *drawCommands*
    // Cette variable comprend une liste des instructions
    // de rendu demandés pendant l'itération courante.
    const drawCommands = [];
    // ## Méthode *init*
    // La méthode d'initialisation prend en paramètre le nom d'un objet de
    // type *canvas* de la page web où dessiner. On y extrait
    // et conserve alors une référence vers le contexte de rendu 2D.
    function init(canvasId) {
        exports.canvas = document.getElementById(canvasId);
        ctx = exports.canvas.getContext('2d');
    }
    exports.init = init;
    // ## Méthode *loadImage*
    // Cette méthode instancie dynamiquement un objet du navigateur
    // afin qu'il la charge. Ce chargement se faisant de façon
    // asynchrone, on crée une [promesse](http://bluebirdjs.com/docs/why-promises.html)
    // qui sera [résolue](http://bluebirdjs.com/docs/api/new-promise.html)
    // lorsque l'image sera chargée.
    function loadImage(name) {
        return new Promise((resolve) => {
            const imgDownload = new Image();
            imgDownload.onload = () => {
                resolve(imgDownload);
            };
            imgDownload.src = `../img/${name}.png`;
        });
    }
    exports.loadImage = loadImage;
    // ## Méthode *drawCenter*
    // Cette méthode ajoute à la liste des commandes de rendu une
    // image centrée aux coordonnées spécifiées.
    function drawCenter(img, x, y) {
        drawCommands.push({
            image: img,
            x: x,
            y: y,
        });
    }
    exports.drawCenter = drawCenter;
    // ## Méthode *renderFrame*
    // Cette méthode exécute les commandes de rendu en attente.
    function renderFrame() {
        ctx.clearRect(0, 0, exports.canvas.width, exports.canvas.height);
        drawCommands.forEach((c) => {
            ctx.drawImage(c.image, c.x - (c.image.width / 2), c.y - (c.image.height / 2));
        });
        drawCommands.length = 0;
    }
    exports.renderFrame = renderFrame;
    // ## Méthode *requestFullScreen*
    // Méthode utilitaire pour mettre le canvas en plein écran.
    // Il existe plusieurs méthodes selon le navigateur, donc on
    // se doit de vérifier l'existence de celles-ci avant de les
    // appeler.
    //
    // À noter qu'un script ne peut appeler le basculement en plein
    // écran que sur une action explicite du joueur.
    function requestFullScreen() {
        const method = exports.canvas.requestFullscreen || exports.canvas.webkitRequestFullScreen || function () { };
        method.apply(exports.canvas);
    }
    exports.requestFullScreen = requestFullScreen;
});
// # Fonctions d'entrée
// Méthodes nécessaires pour saisir les entrées de l'utilisateur.
define("src/inputAPI", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ## Variable *keyPressed*
    // Tableau associatif vide qui contiendra l'état courant
    // des touches du clavier.
    const keyPressed = {};
    // ## Méthode *setupKeyboardHandler*
    // Cette méthode enregistre des fonctions qui seront
    // appelées par le navigateur lorsque l'utilisateur appuie
    // sur des touches du clavier. On enregistre alors si la touche
    // est appuyée ou relâchée dans le tableau `keyPressed`.
    //
    // On utilise la propriété `code` de l'événement, qui est
    // indépendant de la langue du clavier (ie.: WASD vs ZQSD)
    //
    // Cette méthode est appelée lors du chargement de ce module.
    function setupKeyboardHandler() {
        document.addEventListener('keydown', (evt) => {
            keyPressed[evt.code] = true;
        }, false);
        document.addEventListener('keyup', (evt) => {
            keyPressed[evt.code] = false;
        }, false);
    }
    // ## Méthode *getAxisY*
    // Cette méthode prend en paramètre l'identifiant du joueur (0 ou 1)
    // et retourne une valeur correspondant à l'axe vertical d'un faux
    // joystick. Ici, on considère les paires W/S et les flèches haut et
    // bas comme les extrémums de ces axes.
    //
    // Si on le voulait, on pourrait substituer cette implémentation
    // par clavier par une implémentation de l'[API Gamepad.](https://developer.mozilla.org/fr/docs/Web/Guide/API/Gamepad)
    function getAxisY(player) {
        if (player === 0) {
            if (keyPressed['KeyW'] === true) {
                return -1;
            }
            if (keyPressed['KeyS'] === true) {
                return 1;
            }
        }
        if (player === 1) {
            if (keyPressed['ArrowUp'] === true) {
                return -1;
            }
            if (keyPressed['ArrowDown'] === true) {
                return 1;
            }
        }
        return 0;
    }
    exports.getAxisY = getAxisY;
    // Configuration de la capture du clavier au chargement du module.
    // On met dans un bloc `try/catch` afin de pouvoir exécuter les
    // tests unitaires en dehors du navigateur.
    try {
        setupKeyboardHandler();
    }
    catch (e) { }
});
define("src/entity", ["require", "exports", "src/components"], function (require, exports, components_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Classe *Entity*
    // La classe *Entity* représente un objet de la scène qui
    // peut contenir des enfants et des composants.
    class Entity {
        constructor() {
            this.components = new Map();
            this.children = new Map();
        }
        // ## Méthode *addComponent*
        // Cette méthode prend en paramètre le type d'un composant et
        // instancie un nouveau composant.
        addComponent(type) {
            const newComponent = Entity.componentCreator(type, this);
            this.components.set(type, newComponent);
            return newComponent;
        }
        // ## Fonction *getComponent*
        // Cette fonction retourne un composant existant du type spécifié
        // associé à l'objet.
        getComponent(type) {
            return this.components.get(type);
        }
        // ## Méthode *addChild*
        // La méthode *addChild* ajoute à l'objet courant un objet
        // enfant.
        addChild(objectName, child) {
            this.children.set(objectName, child);
        }
        // ## Fonction *getChild*
        // La fonction *getChild* retourne un objet existant portant le
        // nom spécifié, dont l'objet courant est le parent.
        getChild(objectName) {
            return this.children.get(objectName);
        }
        // ## Méthode *walkChildren*
        // Cette méthode parcourt l'ensemble des enfants de cette
        // entité et appelle la fonction `fn` pour chacun, afin
        // d'implémenter le patron de conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
        walkChildren(fn) {
            this.children.forEach(fn);
        }
        // ## Méthode *walkComponent*
        // Cette méthode parcourt l'ensemble des composants de cette
        // entité et appelle la fonction `fn` pour chacun, afin
        // d'implémenter le patron de conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
        walkComponent(fn) {
            this.components.forEach(fn);
        }
    }
    // ## Fonction *componentCreator*
    // Référence vers la fonction permettant de créer de
    // nouveaux composants. Permet ainsi de substituer
    // cette fonction afin de réaliser des tests unitaires.
    Entity.componentCreator = components_1.ComponentFactory.create;
    exports.Entity = Entity;
});
define("src/system", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/scene", ["require", "exports", "src/entity"], function (require, exports, entity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Classe *Scene*
    // La classe *Scene* représente la hiérarchie d'objets contenus
    // simultanément dans la logique du jeu.
    class Scene {
        // ## Fonction statique *create*
        // La fonction *create* permet de créer une nouvelle instance
        // de la classe *Scene*, contenant tous les objets instanciés
        // et configurés. Le paramètre `description` comprend la
        // description de la hiérarchie et ses paramètres. La fonction
        // retourne une promesse résolue lorsque l'ensemble de la
        // hiérarchie est configurée correctement.
        static create(description) {
            const scene = new Scene(description);
            Scene.current = scene;
            let promise = scene.setupScene()
                .then(() => {
                return scene;
            });
            return promise;
        }
        constructor(description) {
            this.root = new entity_1.Entity();
            this.componentsDescriptions = new Map();
            this.createChildren(this.root, description); // Appel à la fonction de récurrence pour instancier les                                                     Entities
        }
        createChildren(entity, childrenDescription) {
            Object.keys(childrenDescription).forEach((childName) => {
                let child = this.addChildAndComponents(entity, childName, childrenDescription);
                this.createChildren(child, childrenDescription[childName].children);
            });
        }
        addChildAndComponents(entity, childName, childrenDescription) {
            let child = new entity_1.Entity();
            entity.addChild(childName, child);
            this.createComponents(child, childName, childrenDescription);
            return child;
        }
        createComponents(entity, entityName, childrenDescription) {
            Object.keys(childrenDescription[entityName].components).forEach((componentType) => {
                this.componentsDescriptions.set(entity.addComponent(componentType), childrenDescription[entityName].components[componentType]);
            });
        }
        setupScene() {
            let setupChildrenPromises = [];
            this.setupChildren(this.root, setupChildrenPromises);
            return Promise.all(setupChildrenPromises);
        }
        setupChildren(entity, setupChildrenPromises) {
            entity.walkChildren((child) => {
                child.walkComponent((component) => {
                    setupChildrenPromises.push(component.setup(this.componentsDescriptions.get(component)));
                });
                this.setupChildren(child, setupChildrenPromises);
            });
        }
        // ## Fonction *findObject*
        // La fonction *findObject* retourne l'objet de la scène
        // portant le nom spécifié.
        findObject(objectName) {
            return this.findObjectInChildren(this.root, objectName);
        }
        findObjectInChildren(entity, objectName) {
            let searchedObject = entity.getChild(objectName);
            if (searchedObject !== undefined) {
                return searchedObject;
            }
            else {
                entity.walkChildren((child) => {
                    if (!searchedObject)
                        searchedObject = this.findObjectInChildren(child, objectName);
                });
                return searchedObject;
            }
        }
        // ## Méthode *walk*
        // Cette méthode parcourt l'ensemble des entités de la
        // scène et appelle la fonction `fn` pour chacun, afin
        // d'implémenter le patron de conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
        walk(fn) {
            return this.walkChildren(this.root, "root", fn);
        }
        walkChildren(entity, childName, fn) {
            let promise = Promise.resolve();
            entity.walkChildren((entity, childName) => {
                promise = promise.then(() => fn(entity, childName))
                    .then(() => this.walkChildren(entity, childName, fn));
            });
            return promise;
        }
    }
    exports.Scene = Scene;
});
define("src/displaySystem", ["require", "exports", "src/graphicsAPI", "src/scene"], function (require, exports, GraphicsAPI, scene_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Fonction *isDisplayComponent*
    // Vérifie si le composant est du type `IDisplayComponent``
    // Voir [la documentation de TypeScript](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
    function isDisplayComponent(arg) {
        return arg.display !== undefined;
    }
    // # Classe *DisplaySystem*
    // Représente le système permettant de gérer l'affichage
    class DisplaySystem {
        // ## Constructeur
        // Initialise l'API graphique.
        constructor(canvasId) {
            GraphicsAPI.init(canvasId);
        }
        // Méthode *iterate*
        // Appelée à chaque tour de la boucle de jeu
        // Parcourt l'ensemble des entités via le patron de
        // conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
        // Appelle ensuite la méthode de rendu de l'API.
        iterate(dT) {
            const walkIterFn = (e) => this.walkFn(dT, e);
            return scene_1.Scene.current.walk(walkIterFn)
                .then(() => GraphicsAPI.renderFrame());
        }
        // Méthode *walkFn*
        // Appelle la méthode `display` sur chaque composant
        // respectant l'interface `IDisplayComponent`
        walkFn(dT, entity) {
            let p = Promise.resolve();
            entity.walkComponent((comp) => {
                if (isDisplayComponent(comp))
                    p = p.then(() => comp.display(dT));
            });
            return p;
        }
    }
    exports.DisplaySystem = DisplaySystem;
});
define("src/logicSystem", ["require", "exports", "src/scene"], function (require, exports, scene_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Fonction *isLogicComponent*
    // Vérifie si le composant est du type `ILogicComponent``
    // Voir [la documentation de TypeScript](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
    function isLogicComponent(arg) {
        return arg.update !== undefined;
    }
    // # Classe *LogicSystem*
    // Représente le système permettant de mettre à jour la logique
    class LogicSystem {
        // Méthode *iterate*
        // Appelée à chaque tour de la boucle de jeu
        // Parcourt l'ensemble des entités via le patron de
        // conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
        iterate(dT) {
            const walkIterFn = (e) => this.walkFn(dT, e);
            return scene_2.Scene.current.walk(walkIterFn);
        }
        // Méthode *walkFn*
        // Appelle la méthode `update` sur chaque composant
        // respectant l'interface `ILogicComponent`
        walkFn(dT, entity) {
            let p = Promise.resolve();
            entity.walkComponent((comp) => {
                if (isLogicComponent(comp))
                    p = p.then(() => comp.update(dT));
            });
            return p;
        }
    }
    exports.LogicSystem = LogicSystem;
});
define("src/components", ["require", "exports", "src/graphicsAPI", "src/inputAPI", "src/scene"], function (require, exports, GraphicsAPI, InputAPI, scene_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Vector2 {
        // ### Constructeur de la classe *Vector2*
        // Le constructeur de la classe de vecteur prend en
        // paramètre un objet comprenant les propriétés `x` et `y`.
        constructor(descr) {
            this.x = descr.x;
            this.y = descr.y;
        }
        // ### Fonction *clone*
        // Les objets JavaScript étant passés par référence, cette
        // fonction permet de créer rapidement une copie de cette
        // structure afin d'y effectuer des opérations sans modifier
        // l'original.
        clone() {
            return new Vector2({
                x: this.x,
                y: this.y,
            });
        }
        // ### Fonction *add*
        // Cette fonction retourne un nouveau vecteur qui représente
        // la somme de ce vecteur et de celui passé en paramètre.
        add(other) {
            return new Vector2({
                x: this.x + other.x,
                y: this.y + other.y,
            });
        }
        // ### Fonciton *scale*
        // Cette fonction retourne un nouveau vecteur qui représente
        // le produit de ce vecteur par une valeur scalaire.
        scale(factor) {
            return new Vector2({
                x: this.x * factor,
                y: this.y * factor,
            });
        }
    }
    class Rectangle {
        // ### Constructeur de la classe *Rectangle*
        // Le constructeur de cette classe prend en paramètre un
        // objet pouvant définir soit le centre et la taille du
        // rectangle (`x`, `y`, `width` et `height`) ou les côtés
        // de celui-ci (`xMin`, `xMax`, `yMin` et `yMax`).
        constructor(descr) {
            const descrAlt = descr;
            this.xMin = descr.xMin || (descrAlt.x - descrAlt.width / 2);
            this.xMax = descr.xMax || (descrAlt.x + descrAlt.width / 2);
            this.yMin = descr.yMin || (descrAlt.y - descrAlt.height / 2);
            this.yMax = descr.yMax || (descrAlt.y + descrAlt.height / 2);
        }
        // ### Fonction *intersectsWith*
        // Cette fonction retourne *vrai* si ce rectangle et celui
        // passé en paramètre se superposent.
        intersectsWith(other) {
            return !((this.xMin >= other.xMax) ||
                (this.xMax <= other.xMin) ||
                (this.yMin >= other.yMax) ||
                (this.yMax <= other.yMin));
        }
    }
    // # Classes de composants
    //
    // ## Classe *Component*
    // Cette classe est une classe de base pour l'ensemble des
    // composants et implémente les méthodes par défaut.
    class Component {
        // ### Constructeur de la classe *Composant*
        // Le constructeur de cette classe prend en paramètre l'objet
        // propriétaire du composant, et l'assigne au membre `owner`.
        constructor(owner) {
            this.owner = owner;
        }
        // ### Méthode *setup*
        // Cette méthode est appelée pour configurer le composant après
        // que tous les composants d'un objet aient été créés. Cette
        // méthode peut retourner une promesse.
        setup(descr) {
        }
    }
    // ## Classe *PositionComponent*
    // Ce composant fournit un concept de position à l'objet.
    class PositionComponent extends Component {
        // ### Méthode *setup*
        // Les propriétés `x` et `y` de la description de ce composant
        // initialisent la propriété `position` de cet objet, ainsi
        // qu'une copie de ce vecteur dans la propriété `originalPosition`.
        setup(descr) {
            this.position = new Vector2(descr);
            this.originalPosition = this.position.clone();
        }
        // ### Méthode *reset*
        // Un appel à cette méthode réinitialise la propriété `position`
        // à sa valeur originale.
        reset() {
            this.position = this.originalPosition.clone();
        }
    }
    class TextureComponent extends Component {
        // ### Méthode *setup*
        // Cette méthode charge une image dont le nom est désigné par
        // la propriété `name` de la description. Cette propriété peut
        // être omise, auquel cas il n'y aura tout simplement pas d'image
        // de chargée. Cette méthode retourne une promesse qui se
        // complète lorsque l'image est complètement chargée.
        setup(descr) {
            if (!descr.name) {
                return;
            }
            return GraphicsAPI.loadImage(descr.name)
                .then((image) => {
                this.image = image;
            });
        }
        // ### Méthode *display*
        // Si il y a une image chargée pour ce composant, on l'affiche
        // à la position du composant *PositionComponent* de l'objet.
        display() {
            const position = this.owner.getComponent('Position').position;
            if (this.image) {
                GraphicsAPI.drawCenter(this.image, position.x, position.y);
            }
        }
    }
    class MotionComponent extends Component {
        // ### Méthode *setup*
        // Les propriétés `dx` et `dy` de la description de ce composant
        // initialisent la propriété `velocity` de cet objet, ainsi
        // qu'une copie de ce vecteur dans la propriété `originalVelocity`.
        // Les propriétés `minX`, `maxX`, `minY` et `maxY` de la
        // description sont conservées afin de limiter les déplacements.
        setup(descr) {
            this.velocity = new Vector2({
                x: descr.dx,
                y: descr.dy,
            });
            this.originalVelocity = this.velocity.clone();
            this.minX = descr.minX;
            this.maxX = descr.maxX;
            this.minY = descr.minY;
            this.maxY = descr.maxY;
        }
        // ### Méthode *update*
        // La valeur de la propriété `position` du composant *PositionComponent*
        // de l'objet associé est incrémentée par la vélocité de ce composant.
        // Si la nouvelle position dépasse les bornes désirées, on inverse
        // alors le déplacement dans l'axe de cette borne. On considère
        // également une légère accélération à la vélocité horizontale
        // pour des raisons de jouabilité.
        update(dT) {
            const positionComponent = this.owner.getComponent('Position');
            const newPosition = positionComponent.position.add(this.velocity.scale(dT));
            positionComponent.position = newPosition;
            if ((newPosition.y < this.minY) || (newPosition.y > this.maxY)) {
                this.velocity.y *= -1;
            }
            if ((newPosition.x < this.minX) || (newPosition.x > this.maxX)) {
                this.velocity.x *= -1.05;
            }
        }
        // ### Méthode *reset*
        // Un appel à cette méthode réinitialise la propriété `velocity`
        // à sa valeur originale.
        reset() {
            this.velocity = this.originalVelocity.clone();
        }
    }
    class ColliderComponent extends Component {
        // ### Propriété *area*
        // Cette fonction retourne le rectangle de collision de l'objet
        // en utilisant le composant *PositionComponent* associé.
        get area() {
            const position = this.owner.getComponent('Position').position;
            return new Rectangle({
                x: position.x,
                y: position.y,
                width: this.width,
                height: this.height,
            });
        }
        // ### Propriété *zone*
        // Cette fonction retourne un rectangle de collision de hauteur
        // infini pour usage interne.
        get zone() {
            const area = this.area;
            area.yMin = Number.NEGATIVE_INFINITY;
            area.yMax = Number.POSITIVE_INFINITY;
            return area;
        }
        // ### Méthode *setup*
        // Les propriétés `width` et `height` de l'objet de description
        // représentent les dimensions du rectangle de collision de
        // l'objet, alors que le tableau `obstacles` comprend les noms
        // des objets à évaluer pour tester les collisions. Les objets
        // sont résolus à partir de leur nom et conservés dans le membre
        // local `obstacles`.
        setup(descr) {
            this.width = descr.width;
            this.height = descr.height;
            this.obstacles = [];
            descr.obstacles.forEach((name) => {
                this.obstacles.push(scene_3.Scene.current.findObject(name));
            });
        }
        // ### Méthode *update*
        // Chaque objet à vérifier pour collision est testé et, si leurs
        // rectangles de collision se superposent, est assigné à la
        // propriété `collision`. On fait de même pour vérifier si les
        // objets sont dans la même zone horizontale, qui est alors
        // associé à la propriété `inZone`. On ne considère ici qu'un
        // seul objet en collision à la fois.
        update() {
            this.collision = null;
            this.inZone = null;
            const area = this.area;
            this.obstacles.forEach((obj) => {
                const otherCollider = obj.getComponent('Collider');
                if (area.intersectsWith(otherCollider.area)) {
                    this.collision = obj;
                }
                if (area.intersectsWith(otherCollider.zone)) {
                    this.inZone = obj;
                }
            });
        }
    }
    class JoystickComponent extends Component {
        // ### Méthode *setup*
        // La description comprend un identifiant `id` pour le joueur,
        // qui correspond au joystick désiré, et un multiplicateur
        // `speed` qui représente l'envergure du déplacement.
        setup(descr) {
            this.id = descr.id;
            this.speed = descr.speed;
        }
        // ### Méthode *update*
        // On va chercher le déplacement désiré depuis le système
        // d'entrées, et on ajoute ce déplacement à la position de
        // l'objet par le composant *PositionComponent*
        update() {
            const dy = InputAPI.getAxisY(this.id);
            const position = this.owner.getComponent('Position').position;
            position.y += dy * this.speed;
        }
    }
    class TextureAtlasComponent extends Component {
        // ### Méthode *setup*
        // Cette méthode crée un tableau associatif `atlas` qui fait
        // la correspondance entre des noms et des images, tirées
        // des propriétés de la description. Cette méthode retourne
        // une promesse qui se complète lorsque toutes les images
        // sont chargées.
        setup(descr) {
            this.atlas = {};
            const promises = [];
            Object.keys(descr).forEach((key) => {
                const p = GraphicsAPI.loadImage(descr[key])
                    .then((image) => {
                    this.atlas[key] = image;
                });
                promises.push(p);
            });
            return Promise.all(promises);
        }
    }
    class ScoreComponent extends Component {
        // ### Méthode *setup*
        // Initialise le pointage du joueur selon la propriété `points`
        // de la description.
        setup(descr) {
            this.points = descr.points;
        }
        // ### Méthode *update*
        // Mets à jour la texture du composant *TextureComponent* avec
        // l'image correspondant au score du joueur, tiré de l'atlas
        // du composant *TextureAtlasComponent*.
        update() {
            const textureComponent = this.owner.getComponent('Texture');
            const atlas = this.owner.getComponent('TextureAtlas').atlas;
            textureComponent.image = atlas[this.points];
        }
    }
    class RefereeComponent extends Component {
        // ### Méthode *setup*
        // La méthode *setup* conserve les références vers les joueurs
        // et la balle.
        setup(descr) {
            this.players = [];
            descr.players.forEach((name) => {
                this.players.push(scene_3.Scene.current.findObject(name));
            });
            this.ball = scene_3.Scene.current.findObject(descr.ball);
        }
        // ### Méthode *update*
        update() {
            // On commence par aller chercher les objets avec lesquel il
            // y a possibilité de collision.
            const ballCollider = this.ball.getComponent('Collider');
            const ballCollision = ballCollider.collision;
            const ballInZone = ballCollider.inZone;
            // Si il y a collision, ça veut dire que le joueur n'a pas
            // raté son coup. Si on n'est pas dans une zone de collision,
            // ça veut dire que la balle n'est pas rendu proche d'une palette.
            // Dans ces deux cas, il n'y a pas eu point. On quitte donc
            // la méthode.
            if (ballCollision || !ballInZone) {
                return;
            }
            // On vérifie pour chaque joueur lequel a raté la balle.
            this.players.forEach((player) => {
                // Si ce joueur n'est pas dans la zone de la balle, ça veut
                // dire qu'il marque un point (ie.: c'est son adversaire qui
                // a raté)
                if (player !== ballInZone) {
                    const scoreObject = player.getChild('score');
                    const scoreComp = scoreObject.getComponent('Score');
                    scoreComp.points++;
                    // On termine au 10e point en affichant un message et en
                    // réinitialisant les scores.
                    if (scoreComp.points > 9) {
                        alert('Partie terminée');
                        this.players.forEach((p) => {
                            p.getChild('score').getComponent('Score').points = 0;
                        });
                    }
                }
                // Quand il y a point, on remet la balle en jeu à sa position
                // et vélocité initiale.
                this.ball.getComponent('Position').reset();
                this.ball.getComponent('Motion').reset();
            });
        }
    }
    class ComponentFactory {
        // ## Fonction statique *create*
        // Cette fonction instancie un nouveau composant choisi dans
        // le tableau `componentCreators` depuis son nom.
        static create(type, owner) {
            const comp = new ComponentFactory.componentCreators[type](owner);
            comp.__type = type;
            return comp;
        }
    }
    // ## Attribut statique *componentCreators*
    // Ce tableau associatif fait le lien entre les noms des composants
    // tels qu'utilisés dans le fichier JSON et les classes de
    // composants correspondants.
    ComponentFactory.componentCreators = {
        Position: PositionComponent,
        Texture: TextureComponent,
        Motion: MotionComponent,
        Collider: ColliderComponent,
        Joystick: JoystickComponent,
        TextureAtlas: TextureAtlasComponent,
        Score: ScoreComponent,
        Referee: RefereeComponent,
    };
    exports.ComponentFactory = ComponentFactory;
});
// # Fonctions utilitaires
// Fonctions utilitaires pour des méthodes génériques qui n'ont
// pas de lien direct avec le jeu.
define("src/utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ## Fonction *requestAnimationFrame*
    // Encapsuler dans une promesse la méthode qui attend la mise
    // à jour de l'affichage.
    function requestAnimationFrame() {
        return new Promise((resolve) => {
            window.requestAnimationFrame(resolve);
        });
    }
    // ## Fonction *iterate*
    // Exécute une itération de la boucle de jeu, en attendant
    // après chaque étape du tableau `actions`.
    function iterate(actions, delta) {
        let p = Promise.resolve();
        actions.forEach((a) => {
            p = p.then(() => {
                return a(delta);
            });
        });
        return p;
    }
    // ## Fonction *loop*
    // Boucle de jeu simple, on lui passe un tableau de fonctions
    // à exécuter à chaque itération. La boucle se rappelle elle-même
    // après avoir attendu le prochain rafraîchissement de l'affichage.
    let lastTime = 0;
    function loop(actions, time = 0) {
        // Le temps est compté en millisecondes, on désire
        // l'avoir en secondes, sans avoir de valeurs trop énorme.
        const delta = clamp((time - lastTime) / 1000, 0, 0.1);
        lastTime = time;
        const nextLoop = (t) => loop(actions, t);
        return iterate(actions, delta)
            .then(requestAnimationFrame)
            .then(nextLoop);
    }
    exports.loop = loop;
    // ## Fonction *inRange*
    // Méthode utilitaire retournant le booléen *vrai* si une
    // valeur se situe dans un interval.
    function inRange(x, min, max) {
        return (min <= x) && (x <= max);
    }
    exports.inRange = inRange;
    // ## Fonction *clamp*
    // Méthode retournant la valeur passée en paramètre si elle
    // se situe dans l'interval spécifié, ou l'extrémum correspondant
    // si elle est hors de l'interval.
    function clamp(x, min, max) {
        return Math.min(Math.max(x, min), max);
    }
    exports.clamp = clamp;
    // ## Fonction *loadAsync*
    // Fonction qui charge un fichier de façon asynchrone,
    // via une [promesse](http://bluebirdjs.com/docs/why-promises.html)
    function loadAsync(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.addEventListener('error', reject);
            xhr.addEventListener('load', () => {
                resolve(xhr);
            });
            xhr.open('GET', url);
            xhr.send();
        });
    }
    exports.loadAsync = loadAsync;
    // ## Fonction *loadJSON*
    // Fonction qui charge un fichier JSON de façon asynchrone,
    // via une [promesse](http://bluebirdjs.com/docs/why-promises.html)
    function loadJSON(url) {
        return loadAsync(url)
            .then((xhr) => {
            return JSON.parse(xhr.responseText);
        });
    }
    exports.loadJSON = loadJSON;
});
define("src/main", ["require", "exports", "src/utils", "src/scene", "src/displaySystem", "src/logicSystem"], function (require, exports, Utils, scene_4, displaySystem_1, logicSystem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // ## Variable *systems*
    // Représente la liste des systèmes utilisés par notre moteur
    let systems;
    // ## Méthode *run*
    // Cette méthode initialise les différents systèmes nécessaires
    // et démarre l'exécution complète du jeu.
    function run(canvasId) {
        setupSystem(canvasId);
        return launchGame();
    }
    exports.run = run;
    // ## Méthode *launchGame*
    // Cette méthode initialise la scène du jeu et lance la
    // boucle de jeu.
    function launchGame() {
        return Utils.loadJSON('scenes/scene.json')
            .then((sceneDescription) => {
            return scene_4.Scene.create(sceneDescription);
        })
            .then((scene) => {
            return Utils.loop([iterate]);
        });
    }
    // ## Méthode *iterate*
    // Réalise une itération sur chaque système.
    function iterate(dT) {
        let p = Promise.resolve();
        systems.forEach((s) => {
            p = p.then(() => s.iterate(dT));
        });
        return p;
    }
    // ## Méthode *setupSystem*
    // Cette méthode initialise les différents systèmes nécessaires.
    function setupSystem(canvasId) {
        const display = new displaySystem_1.DisplaySystem(canvasId);
        const logic = new logicSystem_1.LogicSystem();
        systems = [display, logic];
    }
});
define("src/pong", ["require", "exports", "src/main"], function (require, exports, main_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function pong() {
        main_1.run('canvas');
    }
    exports.pong = pong;
});
define("tests/mockComponent", ["require", "exports", "src/entity"], function (require, exports, entity_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Composant de test *TestComponent*
    // On définit ici un *[mock object](https://fr.wikipedia.org/wiki/Mock_%28programmation_orient%C3%A9e_objet%29)*
    // qui permet de tester les réactions de nos objets de scène
    // avec les composants, sans avoir besoin d'avoir des composants
    // réels.
    class TestComponent {
        // ## Constructeur de la classe *TestComponent*
        // Le constructeur conserve le type demandé et une référence
        // vers l'objet qui l'a créé dans ses attributs. Il appelle
        // ensuite la méthode statique `onCreate` avec une référence
        // à lui-même
        constructor(__type, owner) {
            this.__type = __type;
            this.owner = owner;
            TestComponent.onCreate(this);
        }
        // ## Méthodes du composant
        // Chaque méthode du composant appelle la méthode statique
        // correspondant en passant une référence à lui-même,
        // en plus des paramètres au besoin.
        setup(descr) {
            return TestComponent.onSetup(this, descr);
        }
    }
    // ## Pointeurs de méthodes statiques
    // Ces méthodes statiques n'ont aucun comportement par défaut
    // et, par la nature de JavaScript, pourront être remplacées
    // par des méthodes au besoin des tests.
    // Elles seront appelées lors des différentes actions sur les
    // composants de test afin d'en récupérer de l'information.
    TestComponent.onCreate = () => { };
    TestComponent.onSetup = () => { };
    exports.TestComponent = TestComponent;
    function create(type, owner) {
        return new TestComponent(type, owner);
    }
    function registerMock() {
        entity_2.Entity.componentCreator = create;
    }
    exports.registerMock = registerMock;
});
define("tests/entity", ["require", "exports", "tests/mockComponent", "src/entity", "chai", "mocha"], function (require, exports, mockComponent_1, entity_3, chai_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Classe de test
    // Cette classe de test est utilisée avec [Mocha](https://mochajs.org/),
    // une infrastructure permettant d'effectuer des tests unitaires.
    //
    // Les tests sont réalisés conjointement avec le module [Chai](http://chaijs.com/)
    // qui fournit des fonctions simplifiant les assertions avec
    // les tests. On utilise ici les fonctions [expect](http://chaijs.com/api/bdd/)
    // de Chai, par choix.
    // # Tests sur la classe *Entity*
    describe('Entity', () => {
        // ## *beforeEach*
        // Cette méthode est exécutée par Mocha avant chaque test.
        // On l'utilise pour nettoyer les méthodes statique témoin
        // de la classe de composant de test et pour enregistrer
        // notre module permettant de créer ces composants de test.
        beforeEach(() => {
            mockComponent_1.registerMock();
            mockComponent_1.TestComponent.onCreate = ( /*comp*/) => { };
            mockComponent_1.TestComponent.onSetup = ( /*comp, descr*/) => { };
        });
        // ## Tests unitaires
        //
        // On vérifie ici si on peut créer un objet simple, et si
        // l'objet créé est une instance de la classe d'objet.
        it('le module peut être instancié', (done) => {
            const sceneObj = new entity_3.Entity();
            chai_1.expect(sceneObj).instanceof(entity_3.Entity);
            done();
        });
        // Une instance de la classe Entity devrait avoir
        // ces méthodes et fonctions. Ce test vérifie qu'elles
        // existent bel et bien, sans vérifier leur fonctionnement.
        it('a les méthodes requises', (done) => {
            const sceneObj = new entity_3.Entity();
            chai_1.expect(sceneObj).respondTo('addComponent');
            chai_1.expect(sceneObj).respondTo('getComponent');
            chai_1.expect(sceneObj).respondTo('addChild');
            chai_1.expect(sceneObj).respondTo('getChild');
            chai_1.expect(sceneObj).respondTo('walkChildren');
            chai_1.expect(sceneObj).respondTo('walkComponent');
            done();
        });
        // Ce test vérifie si on peut ajouter un composant à
        // l'objet, par la méthode `addComponent`. Cette méthode
        // devrait instancier un nouveau composant de test, et on
        // conclut donc le test dans la méthode statique appelée
        // par le constructeur.
        it('peut ajouter un composant', (done) => {
            const sceneObj = new entity_3.Entity();
            mockComponent_1.TestComponent.onCreate = (comp) => {
                chai_1.expect(comp.__type).equals('TestComp');
                chai_1.expect(comp.owner).equals(sceneObj);
                done();
            };
            sceneObj.addComponent('TestComp');
        });
        // Ce test vérifie si on peut chercher un composant existant
        // à l'aide de la méthode `getComponent`. On ajoute deux
        // composants distincts à un objet, et on tente de les récupérer.
        it('peut chercher un composant', (done) => {
            const sceneObj = new entity_3.Entity();
            const testComp = new Map();
            mockComponent_1.TestComponent.onCreate = (comp) => {
                testComp.set(comp.__type, comp);
            };
            sceneObj.addComponent('TestComp');
            sceneObj.addComponent('TestOtherComp');
            let value = sceneObj.getComponent('TestComp');
            chai_1.expect(value).instanceof(mockComponent_1.TestComponent);
            chai_1.expect(value).equals(testComp.get('TestComp'));
            value = sceneObj.getComponent('TestOtherComp');
            chai_1.expect(value).instanceof(mockComponent_1.TestComponent);
            chai_1.expect(value).equals(testComp.get('TestOtherComp'));
            done();
        });
        // On doit pouvoir visiter tous les composants de
        // l'entité afin de pouvoir implémenter certains
        // systèmes.
        it('peut itérer sur les composants', (done) => {
            const sceneObj = new entity_3.Entity();
            const visits = new Map();
            mockComponent_1.TestComponent.onCreate = (comp) => {
                visits.set(comp, 0);
            };
            const fn = (c, n) => {
                chai_1.expect(visits.has(c)).true;
                chai_1.expect(c.__type).equals(n);
                visits.set(c, visits.get(c) + 1);
            };
            sceneObj.addComponent('TestComp');
            sceneObj.addComponent('TestOtherComp');
            sceneObj.walkComponent(fn);
            visits.forEach((v) => {
                chai_1.expect(v).equals(1);
            });
            done();
        });
        // On crée ici deux objets simples faisant office d'enfants
        // et on les ajoute à un objet par la méthode `addChild`.
        // On teste également la méthode `getChild` en vérifiant
        // si les objets récupérés sont ceux qui ont été ajoutés.
        it('peut ajouter et chercher des enfants', (done) => {
            const sceneObj = new entity_3.Entity();
            const child1 = {
                hello: 'world'
            };
            const child2 = {
                foo: 'bar'
            };
            sceneObj.addChild('un', child1);
            sceneObj.addChild('deux', child2);
            let value = sceneObj.getChild('un');
            chai_1.expect(value).equals(child1);
            value = sceneObj.getChild('deux');
            chai_1.expect(value).equals(child2);
            done();
        });
        // On doit pouvoir visiter tous les enfants de
        // l'entité afin de pouvoir implémenter certains
        // systèmes.
        it('peut itérer sur les enfants', (done) => {
            const sceneObj = new entity_3.Entity();
            const child1 = {
                hello: 'world'
            };
            const child2 = {
                foo: 'bar'
            };
            const visits = new Map();
            const fn = (e, n) => {
                chai_1.expect(visits.has(n)).true;
                chai_1.expect(sceneObj.getChild(n)).equals(e);
                visits.set(n, visits.get(n) + 1);
            };
            sceneObj.addChild('un', child1);
            sceneObj.addChild('deux', child2);
            visits.set('un', 0);
            visits.set('deux', 0);
            sceneObj.walkChildren(fn);
            visits.forEach((v) => {
                chai_1.expect(v).equals(1);
            });
            done();
        });
    });
});
define("tests/scene", ["require", "exports", "tests/mockComponent", "src/entity", "src/scene", "chai", "mocha"], function (require, exports, mockComponent_2, entity_4, scene_5, chai_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // # Classe de test
    // Cette classe de test est utilisée avec [Mocha](https://mochajs.org/),
    // une infrastructure permettant d'effectuer des tests unitaires.
    //
    // Les tests sont réalisés conjointement avec le module [Chai](http://chaijs.com/)
    // qui fournit des fonctions simplifiant les assertions avec
    // les tests. On utilise ici les fonctions [expect](http://chaijs.com/api/bdd/)
    // de Chai, par choix.
    // # Tests sur la classe *Scene*
    describe('Scene', () => {
        // On va avoir besoin de créer des scènes de test pour
        // la plupart des tests, on crée donc une configuration qui sera
        // réutilisée.
        const sampleScene = {
            empty: {
                components: {},
                children: {},
            },
            complex: {
                components: {
                    comp1: {
                        hello: 'world'
                    },
                    comp2: {
                        foo: 'bar'
                    },
                },
                children: {
                    first: {
                        components: {},
                        children: {},
                    },
                    second: {
                        components: {},
                        children: {},
                    },
                },
            },
            crossRef1: {
                components: {
                    refComp1: {
                        target: 'crossRef2'
                    },
                },
                children: {},
            },
            crossRef2: {
                components: {
                    refComp2: {
                        target: 'crossRef1'
                    },
                },
                children: {},
            },
        };
        // Les noms des différents objets de la hiérarchie ci-dessus.
        // On s'en servira pour vérifier les itérations sur l'ensemble
        // des objets de la scène.
        const sampleSceneObjNames = [
            'empty',
            'complex',
            'first',
            'second',
            'crossRef1',
            'crossRef2',
        ];
        // Tableau associatif qui fait le lien entre les composants
        // et le nom des objets qui les possèdent, pour vérifier les
        // itérations sur l'ensemble des composants de la scène.
        const sampleSceneCompMap = {
            comp1: 'complex',
            comp2: 'complex',
            refComp1: 'crossRef1',
            refComp2: 'crossRef2',
        };
        // ## *beforeEach*
        // Cette méthode est exécutée par Mocha avant chaque test.
        // On l'utilise pour nettoyer les méthodes statique témoin
        // de la classe de composant de test et pour enregistrer
        // notre module permettant de créer ces composants de test.
        beforeEach(() => {
            mockComponent_2.registerMock();
            mockComponent_2.TestComponent.onCreate = ( /*comp*/) => { };
            mockComponent_2.TestComponent.onSetup = ( /*comp, descr*/) => { };
        });
        // ## Tests unitaires
        //
        // On vérifie ici si on peut créer un objet simple, et si
        // l'objet créé est une instance de la classe de scène.
        it('le module peut être instancié', (done) => {
            scene_5.Scene.create({})
                .then((scene) => {
                chai_2.expect(scene).instanceof(scene_5.Scene);
                done();
            })
                .catch((err) => {
                done(err || 'Erreur inconnue');
            });
        });
        // Une instance de la classe Scene devrait avoir ces méthodes
        // et fonctions. Ce test vérifie qu'elles existent bel et bien,
        // sans vérifier leur fonctionnement.
        it('a les méthodes requises', (done) => {
            scene_5.Scene.create({})
                .then((scene) => {
                chai_2.expect(scene).respondTo('findObject');
                chai_2.expect(scene).respondTo('walk');
                done();
            })
                .catch((err) => {
                done(err || 'Erreur inconnue');
            });
        });
        // Ce test vérifie si il est possible de récupérer un objet
        // de la scène par la méthode `findObject`. On crée une scène
        // contenant quelques objets et on tente de les récupérer.
        it('peut chercher un objet de la scène par son nom', (done) => {
            scene_5.Scene.create({
                premier: {
                    components: {},
                    children: {},
                },
                second: {
                    components: {},
                    children: {},
                },
            })
                .then((scene) => {
                const obj1 = scene.findObject('premier');
                chai_2.expect(obj1).exist;
                chai_2.expect(obj1).instanceof(entity_4.Entity);
                const obj2 = scene.findObject('second');
                chai_2.expect(obj2).exist;
                chai_2.expect(obj2).instanceof(entity_4.Entity);
                done();
            })
                .catch((err) => {
                done(err || 'Erreur inconnue');
            });
        });
        // Ce test vérifie qu'il est possible de créer les objets
        // à partir d'une structure de description. On tente par la
        // suite de chercher chaque objet de la liste des objets
        // qui doivent exister.
        it('instancie les objets depuis une description', (done) => {
            scene_5.Scene.create(sampleScene)
                .then((scene) => {
                sampleSceneObjNames.forEach((name) => {
                    const obj = scene.findObject(name);
                    chai_2.expect(obj).exist;
                    chai_2.expect(obj).instanceof(entity_4.Entity);
                });
                done();
            })
                .catch((err) => {
                done(err || 'Erreur inconnue');
            });
        });
        // Certains composants doivent faire référence à d'autres. C'est
        // ce qui motive l'existence de la méthode `setup` de ceux-ci,
        // en plus du constructeur. Pour tester ça, on modifie la méthode
        // statique *onSetup* du composant de test afin qu'il tente
        // de récupérer des références vers d'autres objets. On s'attend
        // à ce que ces objets existent, même s'ils n'ont pas encore été
        // complètement configurés.
        it('gère correctement les références croisées', (done) => {
            const calls = new Map();
            mockComponent_2.TestComponent.onSetup = (comp, descr) => {
                if (!(/^refComp/.test(comp.__type))) {
                    return;
                }
                chai_2.expect(calls).not.property(comp.__type);
                calls.set(comp.__type, comp);
                const refObj = scene_5.Scene.current.findObject(descr.target);
                chai_2.expect(refObj).exist;
                chai_2.expect(refObj).instanceof(entity_4.Entity);
            };
            scene_5.Scene.create(sampleScene)
                .then((scene) => {
                for (let i = 1; i <= 2; ++i) {
                    const compName = `refComp${i}`;
                    const objName = `crossRef${i}`;
                    chai_2.expect(calls.has(compName)).true;
                    const obj = scene.findObject(objName);
                    const comp = obj.getComponent(compName);
                    chai_2.expect(calls.get(compName)).equals(comp);
                }
                done();
            })
                .catch((err) => {
                done(err || 'Erreur inconnue');
            });
        });
        // Les composants peuvent avoir besoin d'exécuter les étapes
        // de configuration de manière asynchrone, à l'aide d'une [promesse](http://bluebirdjs.com/docs/why-promises.html).
        // On doit attendre la résolution de celle-ci avant de terminer
        // l'initialisation de la scène. Pour valider ce comportement,
        // on modifie la méthode statique *onSetup* du composant de test
        // afin qu'il incrémente un compteur et le décrémente après un
        // temps d'attente. Le compteur devrait être à zéro si l'attente
        // a été respectée.
        it('attend la fin des promesses des fonctions "setup" des composants', (done) => {
            function delayPromise(ms) {
                return new Promise((resolve) => {
                    setTimeout(resolve, ms);
                });
            }
            let callsCount = 0;
            mockComponent_2.TestComponent.onSetup = (comp, descr) => {
                callsCount++;
                return delayPromise(10)
                    .then(() => {
                    callsCount--;
                });
            };
            scene_5.Scene.create(sampleScene)
                .then(() => {
                chai_2.expect(callsCount).equals(0);
                done();
            })
                .catch((err) => {
                done(err || 'Erreur inconnue');
            });
        });
        // On doit pouvoir visiter tous les objets de la scène
        // afin de pouvoir implémenter certains systèmes.
        it('implémente une fonction permettant de visiter tous les objets', (done) => {
            let scene;
            const visits = new Map();
            sampleSceneObjNames.forEach((name) => {
                visits.set(name, 0);
            });
            const fn = (e, n) => {
                chai_2.expect(visits.has(n)).true;
                chai_2.expect(scene.findObject(n)).equals(e);
                visits.set(n, visits.get(n) + 1);
                return Promise.resolve();
            };
            scene_5.Scene.create(sampleScene)
                .then((newScene) => {
                scene = newScene;
                return scene.walk(fn);
            })
                .then(() => {
                visits.forEach((v) => {
                    chai_2.expect(v).equals(1);
                });
                done();
            })
                .catch((err) => {
                done(err || 'Erreur inconnue');
            });
        });
    });
});
//# sourceMappingURL=merged.js.map