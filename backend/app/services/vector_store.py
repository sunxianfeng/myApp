"""
Vector store utility using ChromaDB persistent client.
Provides a simple wrapper with add_vector and search_vector methods.
"""
from typing import Any, Dict, List, Optional
import os
import logging

import chromadb

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self, persist_dir: str = "./chroma_db", collection_name: str = "default"):
        """Initialize a persistent ChromaDB client and collection.

        persist_dir: path where Chroma will store its files (relative to backend working dir)
        collection_name: name of the collection to use/create
        
        Note: This initialization is synchronous and should be done in a background thread
        when called from async contexts.
        """
        try:
            os.makedirs(persist_dir, exist_ok=True)
            
            # Use PersistentClient for better persistence
            self.client = chromadb.PersistentClient(path=persist_dir)
            
            # Use a named collection where vectors will be stored
            self.collection = self.client.get_or_create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"}  # Use cosine similarity
            )
            logger.info(f"Initialized ChromaDB collection '{collection_name}' at {persist_dir}")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise

    def add_vector(self, id: str, vector: List[float], metadata: Optional[Dict[str, Any]] = None, document: Optional[str] = None) -> bool:
        """Add a single vector to the collection.

        id: unique id for the vector (string)
        vector: list of floats
        metadata: optional dict of metadata
        document: optional textual document to attach
        Returns True on success, False on failure.
        """
        try:
            # Convert all metadata values to strings to avoid ChromaDB type issues
            clean_metadata = {}
            if metadata:
                for key, value in metadata.items():
                    if isinstance(value, bool):
                        clean_metadata[key] = str(value).lower()
                    elif value is None:
                        clean_metadata[key] = ""
                    else:
                        clean_metadata[key] = str(value)
            
            self.collection.add(
                ids=[id],
                embeddings=[vector],
                metadatas=[clean_metadata],
                documents=[document or ""],
            )
            logger.debug(f"Added vector {id} to collection")
            return True
        except Exception as e:
            logger.error(f"Failed to add vector {id}: {e}")
            return False

    def search_vector(self, vector: List[float], limit: int = 10) -> Dict[str, Any]:
        """Search the collection for nearest neighbors.

        Returns the raw Chroma query result dict containing ids, distances, metadatas, documents.
        """
        try:
            results = self.collection.query(
                query_embeddings=[vector],
                n_results=limit,
                include=["metadatas", "distances", "documents"],
            )
            logger.debug(f"Vector search returned {len(results.get('ids', [[]])[0])} results")
            return results
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return {"ids": [[]], "distances": [[]], "metadatas": [[]], "documents": [[]]}


# Simple singleton accessor used by other services
_vector_store_instance: Optional[VectorStore] = None


def get_vector_store(persist_dir: str = "./chroma_db", collection_name: str = "default") -> VectorStore:
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = VectorStore(persist_dir=persist_dir, collection_name=collection_name)
    return _vector_store_instance
