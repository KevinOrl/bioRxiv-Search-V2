# Documentación: Instrucciones para ejecutar el proyecto

Hola! Esta guía proporciona los pasos necesarios para configurar el ambiente de desarrollo para el proyecto 1 de bases de datos II.

# Índice
- [Documentación: Instrucciones para ejecutar el proyecto](#documentación-instrucciones-para-ejecutar-el-proyecto)
- [Índice](#índice)
  - [1. Pruebas unitarias](#1-pruebas-unitarias)
  - [2. Instalación de Docker](#2-instalación-de-docker)
  - [3. Habilitar Kubernetes en Docker](#3-habilitar-kubernetes-en-docker)
  - [4. Instalación de Lens](#4-instalación-de-lens)
  - [5. Instalación de Python](#5-instalación-de-python)
  - [6. Instalación de Visual Studio Code (VSCode)](#6-instalación-de-visual-studio-code-vscode)
  - [7. Verificar que kubectl esté funcionando](#7-verificar-que-kubectl-esté-funcionando)
  - [8. Instalación y verificación de Helm](#8-instalación-y-verificación-de-helm)
  - [9. Build.sh](#9-buildsh)
  - [10. Install.sh](#10-installsh)
  - [11. Realizar la configuración de MongoDB](#11-realizar-la-configuración-de-mongodb)
  - [12. Interfaz de RabbitMQ](#12-interfaz-de-rabbitmq)
- [Ejecución del Programa](#ejecución-del-programa)
  - [13. Conexión a Firebase](#13-conexión-a-firebase)
  - [14. Levantamiento de la API](#14-levantar-la-api)
  - [15. Link de la UI](#15-link-de-la-ui)
  - [16. Conclusiones y recomendaciones.](#16-conclusiones-y-recomendaciones)
    - [Conclusiones](#conclusiones)
    - [Recomendaciones](#recomendaciones)
  - [17. Referencias](#17-referencias)


## 1. Pruebas unitarias

Para las pruebas unitarias se probaron los componentes de manera separada, en cada punto encontrara una breve explicacion de como se realizaron asi como un link a un video para verlo de manera grafica y con mayor detalle:

- ***Crontroller***: Para realizar esta prueba se mostraron los logs del deployment desde la interfaz Lens, para poder observar los logs que puntualmente colocamos en funciones donde se consume la api, se consumen los datos de MongoDB para poder traer los datos sobre el *pageSize* y *Sleep*, cuando se hace el calculo de *splits* y además la publicación de los mensajes a *RabbitMQ*.

[Prueba Unitaria Controller](https://drive.google.com/file/d/1Q5rxumhjI_Pb2yYOYnYtxcRqC20dlkeG/view?usp=sharing)

- ***Api Crawler***: Para realizar la prueba de este componente, se muestran los logs del deployment al igual que el componente anterior por medio de la interfaz Lens, para poder observar la información que se loggea. Este deploymente consume los mensajes de RabbitMQ de cada uno de los splits y hace un apoximado de que pagina a que pagina de la Api bioRxiv va a tener de documentos cada split, por lo tanto luego de ver la información nos vamos a la interfaz de RabbitMQ para poder ver los mensajes en la cola que se envían después de procesar los documentos por cada split y por último desde *GitBash* nos vamos al disco compartido de tipo *ReadWriteMany* ya que fue la unica forma de ver los documentos descargados por cada split.

[Prueba Unitaria Api Crawler](https://drive.google.com/file/d/1-yWetrvZZPD5g2xfnpMvKa_IPhkv7QJJ/view?usp=sharing)

- ***Spacy Entity Extractor***: Para realizar las pruebas vemos los logs por medio de interfaz Lens, en el cual vemos que consume los mensajes de la cola donde los guarda el componente Api Crawler, además a ello podemos observar mediante el *GitBash* también, como se le agrega a los documentos el nuevo array generado llamado ``entities`` en los archivos de la carpeta llamada ``augmented``.

[Prueba Unitaria Spacy Entity Extractor](https://drive.google.com/file/d/10OcJC528KRM70hYpMqSexrSccO5BTy5C/view?usp=sharing)

- ***Spark Job Processor***: Para poder realizar las pruebas unitarias de este componente, vamos a ver los logs del job por medio de la interfaz lens, vemos como por medio de un archivo llamado ``.processed_files.json`` se guardan los archivos que ahorita mismo ya se han procesado y además a ello, nos dirigimos a MongoDB para poder observar que los datos se guardan de manera correcta y con el formato indicado en las indicaciones.

[Prueba Unitaria Spark Job Processor](https://drive.google.com/file/d/1qLflVh6DWjV8axJJDmgBMBI7d7DeB86_/view?usp=sharing)

## 2. Instalación de Docker

Se utilizó Docker extensivamente en este proyecto ya que nos permite empaquetar y ejecutar aplicaciones en entornos aislados.

1. Descargar Docker Desktop desde [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Escoger la instalación para el sistema operativo correspondiente.

## 3. Habilitar Kubernetes en Docker

1. Abrir Docker Desktop.
2. Ir a **Settings > Kubernetes**.
3. Activar la opción "Enable Kubernetes".
4. Seleccionar Kubeadm en "Cluster Settings"
5. Aplicar los cambios y esperar a que Kubernetes esté activo.

## 4. Instalación de Lens

Lens nos facilita la gestión de Kubernetes, los pods, cronjobs y demás servicios.

1. Descargar Lens desde [https://k8slens.dev/](https://k8slens.dev/).
2. Instalarlo y abrirlo.
3. El cluster de Kubernetes debería conectarse automáticamente.

## 5. Instalación de Python

1. Descargar e instalar Python desde [https://www.python.org/downloads/](https://www.python.org/downloads/).

## 6. Instalación de Visual Studio Code (VSCode)

1. Descargar e instalar VSCode desde [https://code.visualstudio.com/](https://code.visualstudio.com/).

## 7. Verificar que kubectl esté funcionando
`kubectl` es el command line tool de kubernetes y nos permite ejecutar comandos para la herramienta. 
Podemos correr el siguiente comando para verificar la instalación de kubectl y que no tengamos pods activos antes de comenzar a bajar las imágenes.

```sh
kubectl get pods
```

Si no está instalado, referirse a las instrucciones en [https://kubernetes.io/docs/tasks/tools/install-kubectl/](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

## 8. Instalación y verificación de Helm

1. Instalar Helm siguiendo las instrucciones en [https://helm.sh/docs/intro/install/](https://helm.sh/docs/intro/install/).
2. Verificar la instalación ejecutando:

```sh
helm version
```

## 9. Build.sh

1. En el archivo `build.sh` localizado en `./P2/docker/`
2. Se debe ejecutar desde el *GitBash* el script `build.sh` seguido de el usuario de *Docker*, en la carpeta ..\2025-01-IC4302\P2\docker:

```sh
./build.sh orlkasesina06
```
3. Verificar la instalación de las imágenes correctamente en Docker.
4. Verificar la existencia de los pods en Lens.

## 10. Install.sh

Luego se debe ejecutar desde el *GitBash* el script `install.sh`, en la carpeta ..\2025-01-IC4302\P2\charts:

```sh
./install.sh
```

## 11. Realizar la configuración de MongoDB

1. En el navegador debemos ir al siguiente link y registrarse para poder hacer la cofiguración exitosa de MongoDB: [Registro a MongoDB](https://www.mongodb.com/es/cloud/atlas/register), luego de ello, llenar el formulario de aptitudes personales y experiencia con MongoDB para luego pasar al paso en donde creamos el cluster, clickear en el botón *create database* para luego clickear el que dice Choose a connection method. En la siguiente página colocamos *drivers* como metodo, para llenar a la configuración final de la base, y antes clikear al botón *Done* debemos copiar la credencial que sale en el recuadro en el apartado titulado *Use this connection string in your application*, para luego darle *Done*.

2. Debemos ir al apartado de la izquierda, y seleccionar el apartado *Clusters*, dentro de este apartado salen algunas opciones, seleccionamos la que dice *Browse Collections*, en ese apartado seleccionamos *create database* con los siguientes campos: **Database name: tasksdb, Collection Name: jobs y Additional Preferences: dejamos el default** y seleccionamos *Create*. 

3. Cuando ya se tiene la colección creada que coloca un ejemplo de resultado para que el programa comience su funcionamiento:
  - En el botón de **insert document**, se selecciona la view en "{}"
  - Se coloca el siguiente ejemplo:
  ```sh
  {"_id":{"$oid":"681d6ce6d1bd5d39b5d3aa2e"},"pageSize":{"$numberInt":"100"},"sleep": { "$numberInt": "5" }} 
  ```
  - Luego se le da al botón de "insert"

4. Posteriormente, hay que crear la otra colección para el funcionamiento de los componentes más adelante. Sobre la base de datos, se le da click al "+" para crear la colección. Luego se coloca el nombre "documents" para darle al botón de "create, en Additional Preferences: dejamos el default. 
  
5. Para configurar la búsqueda de índice, nos posamos sobre las diferentes secciones del cluster y le damos click al apartado de "Atlas Search". 

6. Nos va a aparecer un botón verde que dice "Create Search Index" y le damos click. Para configurarla, en la sección de "Search Type", lo dejamos como "Atlas Search". En la siguiente sección de "Index Name and Data Source" debemos nombrar el buscador. Un ejemplo sería "documents_search". En el apartado de "Database and Collection" no tocamos la sección de "sample_mflix" y el de "tasksjobs", seleccionamos el de "documents"

7. Para terminar, debemos crear el mapping con todos los datos a buscar y visualizar, podemos seleccionar con Visual Editor o Json Editor para crearlo. Es más recomendable con Json Editor, por lo que si le damos click ahí y le damos "next", debemos colocar el siguiente mapping:
```sh
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "author_inst": {
        "type": "stringFacet"
      },
      "author_name": {
        "type": "stringFacet"
      },
      "category": {
        "type": "stringFacet"
      },
      "entities": {
        "type": "document",
        "fields": {
          "label": {
            "type": "stringFacet"
          },
          "text": {
            "type": "string",
            "analyzer": "lucene.standard",
            "searchAnalyzer": "lucene.standard"
          }
        }
      },
      "rel_abs": {
        "analyzer": "lucene.standard",
        "type": "string"
      },
      "rel_date": {
        "type": "dateFacet"
      },
      "rel_title": {
        "analyzer": "lucene.standard",
        "type": "string"
      },
      "type": {
        "type": "stringFacet"
      }
    }
  }
}
```

8. Para finalizar, le damos al botón "next". Ahora vamos a ver un review de la búsqueda y para terminar le damos al botón "Create Search Index".

9. Después, no va a mandar a la página inicial, mientras la búsqueda se crea y se coloca en "ready".

10. Recuerdan la credencial que copiamos en el paso 1 del apartado *Use this connection string in your application*, debemos ahora usarlo como variable de entorno en un deployment y en un cronjob, debemos primero agregarle antes del signo *?* y despues de */* la palabras tasksdb, para luego ir a la carpeta del proyecto ```2025-01-IC4302-PO\P2\charts\application\templates``` y entrar al llamado ```controller.yaml``` y agregar esta nueva credencial ya editada en la variable llamada *MONGO_URI* en el value colocar la credencial y hacer lo mismo en el archivoo llamado ```spark-job-processor.yaml```. Debemos abrir lens e ir al apartado *docker-desktop > Workloads > Deployments* y al llamado ```controller```, darle los 3 puntitos y eliminarlo, debemos hacer esto mismo en el apartado *docker-desktop > Workloads > Cron Jobs* con el llamado ```spark-job-processor``` Luego debemos abrir el *GitBash* en la dirección ```2025-01-IC4302-PO\P2\charts``` y ejecutar el comando ```helm upgrade --install application ./application```

## 12. Interfaz de RabbitMQ

1. Es necesario para crear la cola de los mensajes y si se quiere tener una vista de los mensajes a RabbitMQ, Primero debes ir a *Lens*
2. Services > databases-rabbitmq > En *Ports* Seleccionar *Forward* en el último > Start
3. Una vez en la web colocar en usuario *user* y en contraseña debemos ir a *Lens* > Secrets > databases-rabbitmq > Revelar la contraseña *rabbitmq-password* copiarla y pegarla en la web.

## 13. Conexión a firebase

1. https://firebase.google.com/?hl=es-419 se va al siguiente link y se presiona "Get started in console"

2. Crear un proyecto en firebase y nombrarlo 

3. Generar las credenciales de administrador, "admin-credentials.json" y cambiar las variables de entorno en .../api/.env

4. Probar en POSTMAN el endpoint de test-firestore (ignorar el error de que el api no esta activado)

5. Seguir el URL del error para habilitar el API en google cloud

6. Crear DB en modo test

7. Probar con postman en localhost/test-firestore y verificar que se cree una coleccion test con un documento "hello: world"


## 14. Levantar la API
En la terminal, se debe ir a la dirección del proyecto e irse a la carpeta llamada "api"
```
    cd <ruta-proyecto>/api
```
Y se debe ejecutar el siguiente comando
```
    node src/index.js
```

## 15. Link de la UI
La interfaz gráfica se encuentra en el siguiente link de Vercel: https://2025-01-ic-4302-khaki.vercel.app/

Nota: Solo el admin puede acceder al link de los deployments de Vercel, por lo que se adjunta el correo: *amonterowff@gmail.com*

## 16. Conclusiones y recomendaciones.
### Conclusiones
1. El sistema cumple con la funcionalidad de la app
2. El uso de herramientas como lens y postman es de suma utilidad para ver de manera grafica y verificar el funcionamiento individual de diversos procesos
3. Para la implementacion de un codigo es necesario saber y debatir las fortalezas y debilidades de cada miembro del grupo para tener un mejor manejo
4. El uso de github hace mas facil el traslado del codigo a los demas miembros del grupo
5. La integracion de RabbitMQ y MongoDB permite un mejor manejo de datos
6. Haber hecho caso en el ámbito de trabajar el código en inglés, nos adentra un poco a la realidad del mercado laboral
7. Las pruebas unitarias funcionan muy bien para poder verificar y recordar el funcionamiento de los componentes del proyecto
8. Trabajar la documentacion conforme se trabaja es mejor para darle seguimiento a lo que se va haciendo
9. El proyecto logra un gran avance a nivel personal de cada integrante al trabajar una vez más con comunicaciones con API´s
10. Un buen uso de la libreria logger de python ayuda a visualizar de una mejor manera los mensajes que queremos mostrar en cada uno de los componentes

### Recomendaciones
1. Realizar un mejor manejo del git y git hub para optimizar el manejo de versiones
2. Hacer una mejor reparticion de trabajos para que cada integrante tenga una carga similar
3. Tener mejor manejo del tiempo y aprovechar espacios por mas pronto que sea
4. No hacer cambios que no sean funcionales para no tener codigo erroneo
5. Trabajar con metas periodicas para no postergar ninguna parte del desarrollo
6. Analizar desde un inicio los requerimientos para poder avanzar bien y de manera correcta
7. Evitar el trabajo bajo presion debido al empezar da forma tardia
8. Realizar reuniones mas periodicas con el fin de avanzar de manera mas fluida
9. Buscar información, documentación, repositorios; sobre los componentes a usar
10. Fomentar el aprovechamiento de las herramientas y usar buenas practicas


## 17. Referencias

1. MongoDB, Inc., "MongoDB Atlas: The Multi-cloud Developer Data Platform," [En línea]. Disponible en: [https://www.mongodb.com/atlas/database](https://www.mongodb.com/atlas/database)

2. MongoDB, Inc., "Atlas Search - MongoDB's Full-Text Search Solution," [En línea]. Disponible en: [https://www.mongodb.com/products/platform/atlas-search](https://www.mongodb.com/products/platform/atlas-search)

3. MongoDB, Inc., "MongoDB Atlas Search - Define Field Mappings," [En línea]. Disponible en: [https://www.mongodb.com/docs/atlas/atlas-search/define-field-mappings/](https://www.mongodb.com/docs/atlas/atlas-search/define-field-mappings/)

4. MongoDB, Inc., "MongoDB Atlas Search - Facets," [En línea]. Disponible en: [https://www.mongodb.com/docs/atlas/atlas-search/facet/](https://www.mongodb.com/docs/atlas/atlas-search/facet/)

5. MongoDB, Inc., "MongoDB Atlas Search - Highlighting," [En línea]. Disponible en: [https://www.mongodb.com/docs/atlas/atlas-search/highlighting/](https://www.mongodb.com/docs/atlas/atlas-search/highlighting/)

6. Kubernetes, "Kubernetes Documentation - Persistent Volumes," [En línea]. Disponible en: [https://kubernetes.io/docs/concepts/storage/persistent-volumes/](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)

7. Kubernetes, "Kubernetes Documentation - Access Modes," [En línea]. Disponible en: [https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes)

8. Docker, Inc., "Docker Desktop - The #1 Tool for Building, Running, and Managing Containers," [En línea]. Disponible en: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

9. Lens, "The Kubernetes IDE," [En línea]. Disponible en: [https://k8slens.dev/](https://k8slens.dev/)

10. Vercel, Inc., "Vercel: Develop. Preview. Ship.," [En línea]. Disponible en: [https://vercel.com/](https://vercel.com/)

11. React, "React: A JavaScript library for building user interfaces," [En línea]. Disponible en: [https://react.dev/](https://react.dev/)

12. Vite, "Vite - Next Generation Frontend Tooling," [En línea]. Disponible en: [https://vitejs.dev/](https://vitejs.dev/)

13. Tailwind CSS, "Tailwind CSS - Rapidly build modern websites without ever leaving your HTML," [En línea]. Disponible en: [https://tailwindcss.com/](https://tailwindcss.com/)

14. Apache Software Foundation, "Apache Spark - Unified engine for large-scale data analytics," [En línea]. Disponible en: [https://spark.apache.org/](https://spark.apache.org/)

15. RabbitMQ, "RabbitMQ - Open Source Message Broker," [En línea]. Disponible en: [https://www.rabbitmq.com/](https://www.rabbitmq.com/)

16. Explosion AI, "spaCy - Industrial-strength Natural Language Processing in Python," [En línea]. Disponible en: [https://spacy.io/](https://spacy.io/)

17. Python Software Foundation, "Python," [En línea]. Disponible en: [https://www.python.org/](https://www.python.org/)

18. pika, "Pika - Pure Python RabbitMQ/AMQP 0-9-1 client library," [En línea]. Disponible en: [https://pika.readthedocs.io/](https://pika.readthedocs.io/)

19. PyMongo, "PyMongo - MongoDB Driver for Python," [En línea]. Disponible en: [https://pymongo.readthedocs.io/](https://pymongo.readthedocs.io/)

20. The pandas development team, "pandas - Python Data Analysis Library," [En línea]. Disponible en: [https://pandas.pydata.org/](https://pandas.pydata.org/)

21. Node.js Foundation, "Node.js," [En línea]. Disponible en: [https://nodejs.org/](https://nodejs.org/)

22. npm, Inc., "npm - Build amazing things," [En línea]. Disponible en: [https://www.npmjs.com/](https://www.npmjs.com/)

23. Express.js, "Express - Node.js web application framework," [En línea]. Disponible en: [https://expressjs.com/](https://expressjs.com/)

24. MongoDB, Inc., "Mongoose - elegant mongodb object modeling for node.js," [En línea]. Disponible en: [https://mongoosejs.com/](https://mongoosejs.com/)

25. Google, "Firebase - Build and operate apps with confidence," [En línea]. Disponible en: [https://firebase.google.com/](https://firebase.google.com/)

26. cors, "CORS middleware for Express.js," [En línea]. Disponible en: [https://www.npmjs.com/package/cors](https://www.npmjs.com/package/cors)

27. dotenv, "dotenv - Load environment variables from .env file," [En línea]. Disponible en: [https://www.npmjs.com/package/dotenv](https://www.npmjs.com/package/dotenv)

28. Python Software Foundation, "os — Miscellaneous operating system interfaces," [En línea]. Disponible en: [https://docs.python.org/3/library/os.html](https://docs.python.org/3/library/os.html)

29. Python Software Foundation, "json — JSON encoder and decoder," [En línea]. Disponible en: [https://docs.python.org/3/library/json.html](https://docs.python.org/3/library/json.html)

30. Python Software Foundation, "logging — Logging facility for Python," [En línea]. Disponible en: [https://docs.python.org/3/library/logging.html](https://docs.python.org/3/library/logging.html)

31. Python Software Foundation, "glob — Unix style pathname pattern expansion," [En línea]. Disponible en: [https://docs.python.org/3/library/glob.html](https://docs.python.org/3/library/glob.html)

32. Python Software Foundation, "datetime — Basic date and time types," [En línea]. Disponible en: [https://docs.python.org/3/library/datetime.html](https://docs.python.org/3/library/datetime.html)

33. Python Software Foundation, "time — Time access and conversions," [En línea]. Disponible en: [https://docs.python.org/3/library/time.html](https://docs.python.org/3/library/time.html)

34. Apache Software Foundation, "PySpark SQL Module - SparkSession," [En línea]. Disponible en: [https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.SparkSession.html](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.SparkSession.html)

35. Apache Software Foundation, "PySpark SQL Functions," [En línea]. Disponible en: [https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/functions.html](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/functions.html)

36. Apache Software Foundation, "PySpark SQL Types," [En línea]. Disponible en: [https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/types.html](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/types.html)

37. MongoDB, Inc., "PyMongo - Python driver for MongoDB," [En línea]. Disponible en: [https://pymongo.readthedocs.io/](https://pymongo.readthedocs.io/)

38. Pika Contributors, "Pika - Pure Python RabbitMQ/AMQP 0-9-1 client library," [En línea]. Disponible en: [https://pika.readthedocs.io/](https://pika.readthedocs.io/)

39. Explosion AI, "spaCy - Industrial-strength Natural Language Processing," [En línea]. Disponible en: [https://spacy.io/](https://spacy.io/)

40. Kenneth Reitz, "requests - HTTP for Humans," [En línea]. Disponible en: [https://requests.readthedocs.io/](https://requests.readthedocs.io/)

41. BioRxiv, "bioRxiv API - RESTful interface to the bioRxiv preprint server," [En línea]. Disponible en: [https://api.biorxiv.org/](https://api.biorxiv.org/)

42. NFS-Ganesha Authors, "NFS-Ganesha - NFS server running in user space," [En línea]. Disponible en: [https://github.com/nfs-ganesha/nfs-ganesha](https://github.com/nfs-ganesha/nfs-ganesha)

43. The Kubernetes Authors, "Kubernetes - Production-Grade Container Orchestration," [En línea]. Disponible en: [https://kubernetes.io/docs/home/](https://kubernetes.io/docs/home/)