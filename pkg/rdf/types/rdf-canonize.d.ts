// types/rdf-canonize.d.ts

declare module 'rdf-canonize' {
  /**
   * Canonization algorithm identifiers
   */
  export type Algorithm = 'RDFC-1.0' | 'URDNA2015';

  /**
   * Options for the canonize function
   */
  export interface CanonizeOptions {
    algorithm?: Algorithm;
    inputFormat?: string;
    useNative?: boolean;
  }

  /**
   * Minimal RDF term structure
   */
  export interface Term {
    termType: 'NamedNode' | 'BlankNode' | 'Literal' | 'DefaultGraph';
    value: string;
  }

  /**
   * Minimal RDF quad structure
   */
  export interface Quad {
    subject: Term;
    predicate: Term;
    object: Term;
    graph: Term;
  }

  /**
   * Canonizes RDF dataset or N-Quads string.
   * Returns canonical N-Quads string.
   */
  export function canonize(
    input: Quad[] | string,
    options?: CanonizeOptions
  ): Promise<string>;
}
