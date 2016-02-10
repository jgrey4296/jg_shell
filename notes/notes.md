#Rete Based Authoring Shell

##Motivation

**CiF/Ensemble** separates the elements an author defines into *Rules*, *Facts*, and
*Performances*. It does not support these different modalities of authoring
however. Facts, taken together, describe a Schema (in Ensemble's terminology) upon
which Rules can reason over. Rules generate elements in that Schema, while also
triggered parameterised performances.

The current means of describing those three separate domains is quite limited. The
Social Schema is described separately from the rules that operate over them, for no
readily apparent reason. Performances depend upon the parameters declared that can be
filled in, but again, there is no suitable communication between this domain and the
other domains.

The intention behind having a single authoring shell is to author the variety of
domains needed for a complex social simulation, having the system update itself as
necessary, provide defined terms as necessary, and suggest where terms are
missing. Such analytic authoring support should, as it's main goal, focus on enabling a
level of complexity to the social simulation that Ensemble would struggle with. By this
I mean the ability to author *Institutions*.

Thus, the motivation for an authoring shell is to provide:

  * Dynamic presentation of defined/absent/used/unused: Facts, Rules, and Performances
  * Uni-Modal input to focus on authoring instead of interface manipulation
  * System Representation of data to support large systems
  * Non-Specific Data representation to enable authoring for a variety of systems
  * Support for Rule modifications as actions (crucial for institutions)
  
##Institutions/Fields

Ensemble enables the simulation of social concerns, which impact upon the actions each
 character performs, 'Social Physics' has been one term applied to the system. If
 Ensemble enables the description and simulation of one level of the social world,
 Institutions a more abstracted, and self-referential, level of action. Institutions
 are a collection of complex, interacting social contexts that: 

  * Structure Actors within, among other things, relations of ability to *modify* the institution,
  * The organisation of activities into Strategic Groups
  * 
  
###Institutional Examples

  * Black Lives Matter: The idea of system preferences in police forces for the targets
    for violence, and the justifications for using violence
  * Red Mars: Intentional Societal Design
  * Stand On Zanzibar: Pervasive patterns throughout a society
  * Government establishment of religion.




##System

