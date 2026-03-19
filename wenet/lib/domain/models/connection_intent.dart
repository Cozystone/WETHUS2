class ConnectionIntent {
  final String personId;
  final bool seekingFriend;
  final bool seekingPeer;

  const ConnectionIntent({
    required this.personId,
    this.seekingFriend = true,
    this.seekingPeer = true,
  });
}
