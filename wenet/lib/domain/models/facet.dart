enum FacetType { interest, value, rhythm, communication, relational }

class Facet {
  final String key;
  final FacetType type;
  final double weight;

  const Facet({required this.key, required this.type, required this.weight});
}

class FacetInteraction {
  final String aFacet;
  final String bFacet;
  final String mode; // resonance / complement / tension
  final double strength;

  const FacetInteraction({
    required this.aFacet,
    required this.bFacet,
    required this.mode,
    required this.strength,
  });
}

class EmergentTrait {
  final String label;
  final double confidence;
  final List<String> sourceFacets;

  const EmergentTrait({
    required this.label,
    required this.confidence,
    required this.sourceFacets,
  });
}
