Meteor.methods({
  /**
   * Adds or removes a user to/from a role.
   * @param users {string[]} identifiers of users to affect
   * @param roles {string[]} identifiers of roles to affect
   * @param isInRole {boolean} whether to add users to roles or to remove user from them
   */
  toggleUsersRoles(users, roles, isInRole) {
    check(users, [String]);
    check(roles, [String]);
    check(isInRole, Boolean);

    const user = Meteor.user();
    if (!Roles.userIsInRole(user, Progressor.ROLE_ADMIN)) {
      throw new Meteor.Error('not-admin', i18n.forUser('error.notAdmin.message', user));
    }

    Roles[isInRole ? 'addUsersToRoles' : 'removeUsersFromRoles'](users, roles);
    if (_.contains(roles, Progressor.ROLE_ADMIN)) {
      _.each(users, u => Houston._admins[isInRole ? 'insert' : 'remove']({ user_id: u }));
    }
  },
});

Accounts.onCreateUser((options, user) => {
  if (options.profile) {
    user.profile = options.profile;
  }
  if (!Roles.getUsersInRole(Progressor.ROLE_ADMIN).count()) {
    // Roles.addUsersToRoles(user._id, Progressor.ROLE_ADMIN);
    // object does not yet exist
    user.roles = [Progressor.ROLE_ADMIN];
    Houston._admins.insert({
      user_id: user._id,
    });
  }
  return user;
});
