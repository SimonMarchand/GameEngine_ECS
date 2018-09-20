import { IEntity, Entity } from './entity';
import { IComponent } from './components';

// # Interface *ISceneWalker*
// Définit le prototype de fonction permettant d'implémenter
// le patron de conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception))
// sur les différentes entités de la scène.
export interface ISceneWalker {
  (entity: IEntity, name: string): Promise<any>;
}

// # Interfaces de description
// Ces interfaces permettent de définir la structure de
// description d'une scène, telle que normalement chargée
// depuis un fichier JSON.
export interface IComponentDesc {
  [key: string]: any;
}

export interface IEntityDesc {
  components: IComponentDesc;
  children: ISceneDesc;
}

export interface ISceneDesc {
  [key: string]: IEntityDesc;
}

// # Classe *Scene*
// La classe *Scene* représente la hiérarchie d'objets contenus
// simultanément dans la logique du jeu.
export class Scene {
  static current: Scene;
  private root : IEntity; // la racine de la scene
  private componentsDescriptions : Map<IComponent, ISceneDesc>; // la map liant les descriptions de                             component aux components (utilisé pour le setup gérant les références croisées)

  // ## Fonction statique *create*
  // La fonction *create* permet de créer une nouvelle instance
  // de la classe *Scene*, contenant tous les objets instanciés
  // et configurés. Le paramètre `description` comprend la
  // description de la hiérarchie et ses paramètres. La fonction
  // retourne une promesse résolue lorsque l'ensemble de la
  // hiérarchie est configurée correctement.
  static create(description: ISceneDesc): Promise<Scene> {
    const scene = new Scene(description);
    Scene.current = scene;
    let promise = scene.setupScene()
      .then(() => {
        return scene;
      });
    return promise;
  }

  private constructor(description: ISceneDesc) {
    this.root = new Entity();
    this.componentsDescriptions = new Map<IComponent, ISceneDesc>();
    this.createChildren(this.root, description); // Appel à la fonction récursive pour instancier les                                                     Entities
  }

  // Fonction récursive parcourant la description des enfants de l'entité passée en paramètre
  createChildren(entity: IEntity, childrenDescription: ISceneDesc){
    Object.keys(childrenDescription).forEach((childName) => { 
      let child = this.createChildAndComponents(entity, childName, childrenDescription)
      this.createChildren(child, childrenDescription[childName].children);
    });
  }

  // Ajoute un enfant et ses composants
  createChildAndComponents(entity : IEntity, childName : string, childrenDescription: ISceneDesc): IEntity{
    let child = new Entity();
    entity.addChild(childName, child);
    this.createComponents(child, childName, childrenDescription);
    return child;
  }

  // Créé les composants d'une entité grace à la description de la scene
  private createComponents(entity: IEntity, entityName : string, childrenDescription: ISceneDesc){
    Object.keys(childrenDescription[entityName].components).forEach((componentType) => {
      this.componentsDescriptions.set(entity.addComponent(componentType),
                                      childrenDescription[entityName].components[componentType]); // Sauvegarde du component et de sa description
    });
  }

  private setupScene(): Promise<any> {
    let setupChildrenPromises: Promise<any>[] = [];
    this.setupChildren(this.root, setupChildrenPromises);
    return Promise.all(setupChildrenPromises);
  }

  private setupChildren(entity: IEntity, setupChildrenPromises: Promise<any>[]) {
    entity.walkChildren((child) => { //Pour chaque enfants 
      child.walkComponent((component) => { //Pour chaque composants
        setupChildrenPromises.push(<Promise<any>> component.setup(this.componentsDescriptions.get(component))); //Ajout d'une promesse dans le tableau de promesses, permettant de savoir que le composant est setup
      });
      this.setupChildren(child, setupChildrenPromises); 
    });
  }

  // ## Fonction *findObject*
  // La fonction *findObject* retourne l'objet de la scène
  // portant le nom spécifié.
  findObject(objectName: string): IEntity {
    return this.findObjectInChildren(this.root, objectName);
  }

  // Fonction récursive pour retrouver l'entité dans la scene 
  findObjectInChildren(entity: IEntity, objectName: string): any {
    let searchedObject = entity.getChild(objectName);
    if (searchedObject !== undefined){
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
  walk(fn: ISceneWalker): Promise<any> {
    return this.walkChildren(this.root, "root", fn)
  }
  
  // Fonction récursive pour parcourrir les entités et appeler la fonction `fn`
  walkChildren(entity: IEntity, childName: string, fn: ISceneWalker): Promise<any> {
    let promise = Promise.resolve(); 
    entity.walkChildren((entity, childName) => {
      promise = promise.then(() => fn(entity, childName)) // Après avoir réalisé la fonction `fn` ...
        .then(() => this.walkChildren(entity, childName, fn)); // ... on réalise la récurrence  
    });
    return promise;
  }
}
