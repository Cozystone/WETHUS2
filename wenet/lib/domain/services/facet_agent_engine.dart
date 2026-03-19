import '../models/facet.dart';
import '../models/semantic_profile.dart';

class FacetAgentResult {
  final List<FacetInteraction> interactions;
  final List<EmergentTrait> emergentTraits;

  const FacetAgentResult({required this.interactions, required this.emergentTraits});
}

class FacetAgentEngine {
  FacetAgentResult analyze({
    required SemanticProfile a,
    required SemanticProfile b,
    int maxFacets = 8,
  }) {
    final facetsA = _extractFacets(a).take(maxFacets).toList();
    final facetsB = _extractFacets(b).take(maxFacets).toList();

    final interactions = <FacetInteraction>[];

    for (final fa in facetsA) {
      for (final fb in facetsB) {
        final gap = (fa.weight - fb.weight).abs();
        final mode = gap < 0.15
            ? 'resonance'
            : (gap < 0.35 ? 'complement' : 'tension');
        interactions.add(FacetInteraction(
          aFacet: fa.key,
          bFacet: fb.key,
          mode: mode,
          strength: 1 - gap,
        ));
      }
    }

    final emergent = _buildEmergentTraits(interactions);
    return FacetAgentResult(interactions: interactions, emergentTraits: emergent);
  }

  List<Facet> _extractFacets(SemanticProfile p) {
    final out = <Facet>[];
    p.traits.forEach((k, v) {
      out.add(Facet(key: k, type: FacetType.relational, weight: v));
    });
    p.values.forEach((k, v) {
      out.add(Facet(key: k, type: FacetType.value, weight: v));
    });
    out.sort((a, b) => b.weight.compareTo(a.weight));
    return out;
  }

  List<EmergentTrait> _buildEmergentTraits(List<FacetInteraction> interactions) {
    final resonances = interactions.where((i) => i.mode == 'resonance').toList();
    if (resonances.length >= 3) {
      return [
        EmergentTrait(
          label: 'Reflective Connector',
          confidence: resonances.take(5).fold<double>(0, (a, b) => a + b.strength) / 5,
          sourceFacets: resonances.take(3).map((e) => '${e.aFacet}-${e.bFacet}').toList(),
        )
      ];
    }
    return [];
  }
}
