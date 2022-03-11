/**
 * @author mrdoob / http://mrdoob.com/
 */

 //convert to nodejs modules format
import * as THREE from 'three';
// THREE.OBJExporter = function () {};
const OBJExporter = function () {};

// THREE.OBJExporter.prototype = {
OBJExporter.prototype = {

	// constructor: THREE.OBJExporter,
	constructor: OBJExporter,

	parse: function ( object, mtlFileName ) {

		var output = '';

		var indexVertex = 0;
		var indexVertexUvs = 0;
		var indexNormals = 0;

		var vertex = new THREE.Vector3();
		var normal = new THREE.Vector3();
		var uv = new THREE.Vector2();

		var i, j, k, l, m, face = [];

		var parseMesh = function ( mesh, mtlFileName ) {

			var nbVertex = 0;
			var nbNormals = 0;
			var nbVertexUvs = 0;

			var geometry = mesh.geometry;

			var normalMatrixWorld = new THREE.Matrix3();

			if ( geometry instanceof THREE.Geometry ) {

				geometry = new THREE.BufferGeometry().setFromObject( mesh );

			}

			if ( geometry instanceof THREE.BufferGeometry ) {

				// shortcuts
				var vertices = geometry.getAttribute( 'position' );
				var normals = geometry.getAttribute( 'normal' );
				var uvs = geometry.getAttribute( 'uv' );
				var indices = geometry.getIndex();

				// name of the mesh object
				output += 'o ' + mesh.name + '\n';

				// material library name
				output += 'mtllib ' + mtlFileName + '.mtl\n';

				// vertices

				if ( vertices !== undefined ) {

					for ( i = 0, l = vertices.count; i < l; i ++, nbVertex ++ ) {

						vertex.x = vertices.getX( i );
						vertex.y = vertices.getY( i );
						vertex.z = vertices.getZ( i );

						// transfrom the vertex to world space
						// vertex.applyMatrix4( mesh.matrixWorld );//deactivate for micmac gui project

						// transform the vertex to export format
						output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n';

					}

				}

				// uvs

				if ( uvs !== undefined ) {

					for ( i = 0, l = uvs.count; i < l; i ++, nbVertexUvs ++ ) {

						uv.x = uvs.getX( i );
						uv.y = uvs.getY( i );

						// transform the uv to export format
						output += 'vt ' + uv.x + ' ' + uv.y + '\n';

					}

				}

				// normals

				if ( normals !== undefined ) {

					normalMatrixWorld.getNormalMatrix( mesh.matrixWorld );

					for ( i = 0, l = normals.count; i < l; i ++, nbNormals ++ ) {

						normal.x = normals.getX( i );
						normal.y = normals.getY( i );
						normal.z = normals.getZ( i );

						// transfrom the normal to world space
						normal.applyMatrix3( normalMatrixWorld );

						// transform the normal to export format
						output += 'vn ' + normal.x + ' ' + normal.y + ' ' + normal.z + '\n';

					}

				}

				var geogrpsArray = [];
				var meshmatArray = Array.isArray( mesh.material ) ? mesh.material : [ mesh.material ];
				if ( geometry.groups.length !== 0 ) {

					geogrpsArray = geometry.groups.slice();

				} else {

					if ( indices === null ) {

						geogrpsArray = [ {
							start: 0,
							count: vertices.count,
							materialIndex: 0
						} ];

					} else {

						geogrpsArray = [ {
							start: 0,
							count: indices.count,
							materialIndex: 0
						} ];

					}

				}

				for ( var grpindex = 0; grpindex < geogrpsArray.length; grpindex ++ ) {

					// name of the mesh material
					if ( meshmatArray[ grpindex ] ) {

						if ( meshmatArray[ grpindex ].name ) {

							output += 'usemtl ' + meshmatArray[ grpindex ].name + '\n';

						} else {

							output += 'usemtl Mat' + geogrpsArray[ grpindex ].materialIndex + '\n';
							mesh.material.name = 'Mat' + geogrpsArray[ grpindex ].materialIndex ++;

						}

					}

					// faces

					if ( indices !== null ) {

						for ( i = geogrpsArray[ grpindex ].start, l = geogrpsArray[ grpindex ].count; i < l + geogrpsArray[ grpindex ].start; i += 3 ) {

							for ( m = 0; m < 3; m ++ ) {

								j = indices.getX( i + m ) + 1;

								face[ m ] = ( indexVertex + j ) + ( normals || uvs ? '/' + ( uvs ? ( indexVertexUvs + j ) : '' ) + ( normals ? '/' + ( indexNormals + j ) : '' ) : '' );

							}

							// transform the face to export format
							output += 'f ' + face.join( ' ' ) + "\n";

						}

					} else {

						for ( i = geogrpsArray[ grpindex ].start, l = geogrpsArray[ grpindex ].count; i < l + geogrpsArray[ grpindex ].start; i += 3 ) {

							for ( m = 0; m < 3; m ++ ) {

								j = i + m + 1;

								face[ m ] = ( indexVertex + j ) + ( normals || uvs ? '/' + ( uvs ? ( indexVertexUvs + j ) : '' ) + ( normals ? '/' + ( indexNormals + j ) : '' ) : '' );

							}

							// transform the face to export format
							output += 'f ' + face.join( ' ' ) + "\n";

						}

					}

				}

			} else {

				console.warn( 'THREE.OBJExporter.parseMesh(): geometry type unsupported', geometry );

			}

			// update index
			indexVertex += nbVertex;
			indexVertexUvs += nbVertexUvs;
			indexNormals += nbNormals;

		};

		var parseLine = function ( line ) {

			var nbVertex = 0;

			var geometry = line.geometry;
			var type = line.type;

			if ( geometry instanceof THREE.Geometry ) {

				geometry = new THREE.BufferGeometry().setFromObject( line );

			}

			if ( geometry instanceof THREE.BufferGeometry ) {

				// shortcuts
				var vertices = geometry.getAttribute( 'position' );

				// name of the line object
				output += 'o ' + line.name + '\n';

				if ( vertices !== undefined ) {

					for ( i = 0, l = vertices.count; i < l; i ++, nbVertex ++ ) {

						vertex.x = vertices.getX( i );
						vertex.y = vertices.getY( i );
						vertex.z = vertices.getZ( i );

						// transfrom the vertex to world space
						vertex.applyMatrix4( line.matrixWorld );

						// transform the vertex to export format
						output += 'v ' + vertex.x + ' ' + vertex.y + ' ' + vertex.z + '\n';

					}

				}

				if ( type === 'Line' ) {

					output += 'l ';

					for ( j = 1, l = vertices.count; j <= l; j ++ ) {

						output += ( indexVertex + j ) + ' ';

					}

					output += '\n';

				}

				if ( type === 'LineSegments' ) {

					for ( j = 1, k = j + 1, l = vertices.count; j < l; j += 2, k = j + 1 ) {

						output += 'l ' + ( indexVertex + j ) + ' ' + ( indexVertex + k ) + '\n';

					}

				}

			} else {

				console.warn( 'THREE.OBJExporter.parseLine(): geometry type unsupported', geometry );

			}

			// update index
			indexVertex += nbVertex;

		};

		object.traverse( function ( child ) {

			if ( child instanceof THREE.Mesh ) {

				parseMesh( child, mtlFileName );

			}

			if ( child instanceof THREE.Line ) {

				parseLine( child );

			}

		} );

		return output;

	},

	// based on https://stackoverflow.com/questions/35070048/export-a-three-js-textured-model-to-a-obj-with-mtl-file
	parseMtl: function ( object ) {

		var outputMtl = '';
		var imageFiles = [];

		var parse = function ( mesh ) {

			var geometry = mesh.geometry;

			if ( geometry instanceof THREE.Geometry ) {

				geometry = new THREE.BufferGeometry().setFromObject( mesh );

			}

			if ( ! ( geometry instanceof THREE.BufferGeometry ) ) {

				return;

			}

			var mminfo = mesh.material;
			var mmA = Array.isArray( mesh.material ) ? mesh.material : [ mesh.material ];

			// name of the mesh material
			if ( ! mminfo ) {

				return;

			}

			for ( var matindex = 0; matindex < mmA.length; matindex ++ ) {

				var mm = mmA[ matindex ];
				if ( mm.name ) {

					outputMtl += 'newmtl ' + mm.name + '\n';
					outputMtl += 'Ka ' + mm.color.r + ' ' + mm.color.g + ' ' + mm.color.b + ' \n';
					outputMtl += 'Kd ' + mm.color.r + ' ' + mm.color.g + ' ' + mm.color.b + ' \n';
					outputMtl += mm.specular ? 'Ks ' + mm.specular.r + ' ' + mm.specular.g + ' ' + mm.specular.b + '\n' : '';
					outputMtl += mm.shininess ? 'Ns ' + mm.shininess + '\n' : '';
					outputMtl += 'Ni ' + mm.refractionRatio + '\n';
					outputMtl += 'd ' + mm.opacity + '\n';

					if ( mm.map && mm.map instanceof THREE.Texture ) {

						var file = mm.map.image.currentSrc.slice( mm.map.image.currentSrc.lastIndexOf( "/" ) + 1 );

						outputMtl += 'map_Ka ' + file + '\n';
						outputMtl += 'map_Kd ' + file + '\n';
						imageFiles.push( mm.map.image.currentSrc );

					}

					if ( mm.specularMap && mm.specularMap instanceof THREE.Texture ) {

						file = mm.specularMap.image.currentSrc.slice( mm.specularMap.image.currentSrc.lastIndexOf( "/" ) + 1 );

						outputMtl += 'map_Ks ' + file + '\n';
						imageFiles.push( mm.specularMap.image.currentSrc );

					}
					if ( mm.alphaMap && mm.alphaMap instanceof THREE.Texture ) {

						file = mm.alphaMap.image.currentSrc.slice( mm.alphaMap.image.currentSrc.lastIndexOf( "/" ) + 1 );

						outputMtl += 'map_d ' + file + '\n';
						imageFiles.push( mm.alphaMap.image.currentSrc );

					}

				}

			}

		};

		object.traverse( function ( child ) {

			if ( child instanceof THREE.Mesh ) {

				parse( child );

			}

		} );

		return {
			mtldata: outputMtl,
			imagelinks: imageFiles
		};

	}

};

export default OBJExporter;